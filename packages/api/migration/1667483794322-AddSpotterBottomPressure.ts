import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpotterBottomPressure1667483794322
  implements MigrationInterface
{
  name = 'AddSpotterBottomPressure1667483794322';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."metrics_metric_enum" ADD VALUE IF NOT EXISTS 'barometric_pressure_bottom'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."metrics_metric_enum" RENAME VALUE 'barometric_pressure' TO 'barometric_pressure_top'`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."metrics_metric_enum" RENAME VALUE 'barometric_pressure_diff' TO 'barometric_pressure_top_diff'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP MATERIALIZED VIEW "latest_data"`);

    await queryRunner.query(
      `ALTER TYPE "public"."metrics_metric_enum" RENAME VALUE 'barometric_pressure_top_diff' TO 'barometric_pressure_diff'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."metrics_metric_enum" RENAME VALUE 'barometric_pressure_top' TO 'barometric_pressure'`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."metrics_metric_enum_old" AS ENUM('temp_alert', 'temp_weekly_alert', 'dhw', 'air_temperature', 'satellite_temperature', 'top_temperature', 'bottom_temperature', 'sst_anomaly', 'significant_wave_height', 'wave_mean_period', 'wave_peak_period', 'wave_mean_direction', 'wind_speed', 'wind_direction', 'cholorophyll_rfu', 'cholorophyll_concentration', 'conductivity', 'water_depth', 'odo_saturation', 'odo_concentration', 'salinity', 'specific_conductance', 'tds', 'turbidity', 'total_suspended_solids', 'sonde_wiper_position', 'ph', 'ph_mv', 'sonde_battery_voltage', 'sonde_cable_power_voltage', 'pressure', 'precipitation', 'rh', 'wind_gust_speed', 'barometric_pressure', 'barometric_pressure_diff')`,
    );
    await queryRunner.query(
      `ALTER TABLE "metrics" ALTER COLUMN "metric" TYPE "public"."metrics_metric_enum_old" USING "metric"::"text"::"public"."metrics_metric_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_series" ALTER COLUMN "metric" TYPE "public"."metrics_metric_enum_old" USING "metric"::"text"::"public"."metrics_metric_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "forecast_data" ALTER COLUMN "metric" TYPE "public"."metrics_metric_enum_old" USING "metric"::"text"::"public"."metrics_metric_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."metrics_metric_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."metrics_metric_enum_old" RENAME TO "metrics_metric_enum"`,
    );

    await queryRunner.query(
      `CREATE MATERIALIZED VIEW "latest_data"
                AS SELECT
                    DISTINCT ON (metric, type, site_id, survey_point_id)
                    "time_series"."id", metric, timestamp, value, type AS "source", site_id, survey_point_id
                FROM "time_series" "time_series"
                INNER JOIN "sources" "sources" ON "sources"."id" = "time_series"."source_id"
                WHERE timestamp >= current_date - INTERVAL '7 days'
                OR type IN ('sonde') AND (timestamp >= current_date - INTERVAL '90 days')
                ORDER BY metric, type, site_id, survey_point_id, timestamp DESC`,
    );
  }
}
