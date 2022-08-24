// eslint-disable-next-line import/no-extraneous-dependencies
import yargs from 'yargs';
import { ConnectionOptions, createConnection } from 'typeorm';
import { last } from 'lodash';
import { Logger } from '@nestjs/common';
import { configService } from '../src/config/config.service';
import { Site } from '../src/sites/sites.entity';
import { SiteSurveyPoint } from '../src/site-survey-points/site-survey-points.entity';
import { TimeSeries } from '../src/time-series/time-series.entity';
import { Sources } from '../src/sites/sources.entity';
import { uploadTimeSeriesData } from '../src/utils/uploads/upload-sheet-data';
import { DataUploads } from '../src/data-uploads/data-uploads.entity';
import { SourceType } from '../src/sites/schemas/source-type.enum';

// Initialize command definition
const { argv } = yargs
  .scriptName('upload-hui-data')
  .usage('$0 <cmd> [args]')
  .example(
    '$0 -f data/file.xml -s 1006 -p 3 -t hui',
    "This command will import the data contained in 'data/file.xml' to the timeseries table for site 1006 on survey point 3.",
  )
  .option('f', {
    alias: 'path',
    describe: 'The path to the hui file to upload',
    demandOption: true,
    type: 'string',
  })
  .option('s', {
    alias: 'site',
    describe: 'The id for the site',
    type: 'string',
    demandOption: true,
  })
  .option('p', {
    alias: 'survey_point',
    describe: 'The id of the corresponding survey point.',
    type: 'string',
    demandOption: false,
  })
  .option('t', {
    alias: 'hui_type',
    describe: 'The hui type indicating how to process the file.',
    type: 'string',
    demandOption: true,
  })
  // Extend definition to use the full-width of the terminal
  .wrap(yargs.terminalWidth());

async function run() {
  // Initialize Nest logger
  const logger = new Logger('ParseHuiData');
  // Extract command line arguments
  const { f: filePath, s: siteId, p: surveyPointId, t: sourceType } = argv;

  logger.log(
    `Script params: filePath: ${filePath}, siteId/surveyPointId: ${siteId}/${surveyPointId}, sourceType: ${sourceType}`,
  );

  // Initialize typeorm connection
  const config = configService.getTypeOrmConfig() as ConnectionOptions;
  const connection = await createConnection(config);

  logger.log('Uploading hui data');
  await uploadTimeSeriesData(
    filePath,
    last(filePath.split('/')) || '',
    siteId,
    surveyPointId,
    sourceType as SourceType,
    // Fetch all needed repositories
    {
      siteRepository: connection.getRepository(Site),
      surveyPointRepository: connection.getRepository(SiteSurveyPoint),
      timeSeriesRepository: connection.getRepository(TimeSeries),
      sourcesRepository: connection.getRepository(Sources),
      dataUploadsRepository: connection.getRepository(DataUploads),
    },
  );

  logger.log('Finished uploading hui data');
}

run();
