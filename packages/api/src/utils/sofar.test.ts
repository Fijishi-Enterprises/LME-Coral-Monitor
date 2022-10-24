import { TestService } from '../../test/test.service';
import { SofarModels, sofarVariableIDs } from './constants';
import { getSofarHindcastData, getSpotterData, sofarHindcast } from './sofar';
import { ValueWithTimestamp } from './sofar.types';

test('It processes Sofar API for daily data.', async () => {
  const testService = TestService.getInstance();
  const noaaAvailability = await testService.getNOAAAvailability();

  jest.setTimeout(30000);
  const values = await getSofarHindcastData(
    'NOAACoralReefWatch',
    'analysedSeaSurfaceTemperature',
    -3.5976336810301888,
    -178.0000002552476,
    new Date('2022-08-31'),
    noaaAvailability,
  );

  expect(values).toEqual([
    { timestamp: '2022-08-30T12:00:00.000Z', value: 27.70993356218372 },
  ]);
});

test('Clips site location correctly', async () => {
  const testService = TestService.getInstance();
  const noaaAvailability = await testService.getNOAAAvailability();

  jest.setTimeout(30000);
  const values = await getSofarHindcastData(
    'NOAACoralReefWatch',
    'analysedSeaSurfaceTemperature',
    41.738,
    -70.625,
    new Date('2022-08-31'),
    noaaAvailability,
  );

  expect(values.length !== 0).toBeTruthy();
});

test('It processes Sofar Spotter API for daily data.', async () => {
  jest.setTimeout(30000);
  const values = await getSpotterData(
    'SPOT-300434063450120',
    new Date('2020-09-02'),
  );

  expect(values.bottomTemperature.length).toEqual(144);
  expect(values.topTemperature.length).toEqual(144);
});

test('it process Sofar Hindcast API for wind-wave data', async () => {
  jest.setTimeout(30000);
  const now = new Date();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const today = now.toISOString();
  const yesterday = yesterdayDate.toISOString();
  const testService = TestService.getInstance();
  const noaaAvailability = await testService.getNOAAAvailability();

  const response = await sofarHindcast(
    SofarModels.SofarOperationalWaveModel,
    sofarVariableIDs[SofarModels.SofarOperationalWaveModel]
      .significantWaveHeight,
    -3.5976336810301888,
    -178.0000002552476,
    yesterday,
    today,
    noaaAvailability,
  );

  const values = response?.values[0] as ValueWithTimestamp;

  expect(new Date(values?.timestamp).getTime()).toBeLessThanOrEqual(
    now.getTime(),
  );
});
