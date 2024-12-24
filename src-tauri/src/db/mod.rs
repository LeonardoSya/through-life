use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres, Row};

#[derive(Debug, Serialize, Deserialize)]
pub struct Point {
    pub id: i64,
    pub data_time: i64,
    pub loc_type: i16,
    pub longitude: f64,
    pub latitude: f64,
    pub heading: Option<f64>,
    pub accuracy: Option<f64>,
    pub speed: Option<f64>,
    pub distance: Option<f64>,
    pub is_back_foreground: i16,
    pub step_type: i16,
    pub altitude: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CityStats {
    pub city_name: String,
    pub province_name: String,
    pub first_visit_time: i64,
    pub last_visit_time: i64,
    pub total_points: i64,
    pub visit_days: i64,
    pub avg_altitude: f64,
    pub avg_speed: f64,
    pub visit_order: i64,
    pub frequency_rank: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyStats {
    pub day_type: String,
    pub city_name: String,
    pub province_name: String,
    pub total_points: i64,
    pub days_count: i64,
    pub avg_speed: f64,
    pub avg_altitude: f64,
    pub total_distance: f64,
    pub distance_per_day: f64,
    pub activity_rank: i64,
}

pub struct DbConnection {
    pool: Pool<Postgres>,
}

impl DbConnection {
    pub async fn new() -> Result<Self, sqlx::Error> {
        // let database_url = "postgres://zhangyiyang:040724@localhost:5432/postgres";
        let database_url = "postgres://default:toH1xYSMfEW6@ep-green-tree-a43jhf6a.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require";
        let pool = match sqlx::postgres::PgPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await
        {
            Ok(pool) => {
                println!("成功连接数据库");
                pool
            }
            Err(e) => {
                println!("数据库连接失败: {:?}", e);
                return Err(e);
            }
        };

        Ok(Self { pool })
    }

    pub async fn get_track_data(
        &self,
        start_time: i64,
        end_time: i64,
    ) -> Result<Vec<Point>, sqlx::Error> {
        let result = sqlx::query(
            r#"
                select 
                    id, data_time, loc_type, 
                    longitude::float8 as longitude,
                    latitude::float8 as latitude,
                    heading::float8 as heading,
                    accuracy::float8 as accuracy,
                    speed::float8 as speed,
                    distance::float8 as distance,
                    is_back_foreground, step_type,
                    altitude::float8 as altitude
                from lifetime 
                where data_time between $1 and $2 
                order by data_time asc
                "#,
        )
        .bind(start_time)
        .bind(end_time)
        .map(|row: sqlx::postgres::PgRow| Point {
            id: row.get("id"),
            data_time: row.get("data_time"),
            loc_type: row.get("loc_type"),
            longitude: row.get("longitude"),
            latitude: row.get("latitude"),
            heading: row.get("heading"),
            accuracy: row.get("accuracy"),
            speed: row.get("speed"),
            distance: row.get("distance"),
            is_back_foreground: row.get("is_back_foreground"),
            step_type: row.get("step_type"),
            altitude: row.get("altitude"),
        })
        .fetch_all(&self.pool)
        .await;

        match &result {
            Ok(points) => println!("轨迹数据查询成功，查询到{}个轨迹点", points.len()),
            Err(e) => println!("轨迹数据查询失败: {:?}", e),
        }

        result
    }

    pub async fn get_total_distance(
        &self,
        start_time: i64,
        end_time: i64,
    ) -> Result<f64, sqlx::Error> {
        let result = sqlx::query(r#"
            select coalesce(sum(case when distance is null or distance = 0 then 0 else distance::float8 end), 0)::float8 as total_distance
            from lifetime where data_time between $1 and $2
        "#,)
        .bind(start_time)
        .bind(end_time)
        .fetch_one(&self.pool)
        .await
        .map(|row| row.get::<f64, _>("total_distance"));

        match &result {
            Ok(distance) => println!("距离计算成功，{}米", distance),
            Err(e) => println!("距离计算失败, {:?}", e),
        }

        result
    }

    pub async fn get_city_stats(&self) -> Result<Vec<CityStats>, sqlx::Error> {
        let result = sqlx::query(
            r#"
            with city_stats as (
                select 
                    c.ct_name as city_name,
                    c.pr_name as province_name,
                    min(l.data_time) as first_visit_time,
                    max(l.data_time) as last_visit_time,
                    count(*) as total_points,
                    count(distinct date(to_timestamp(l.data_time))) as visit_days,
                    avg(l.altitude) as avg_altitude,
                    avg(l.speed) as avg_speed
                from lifetime l
                join china_cities c on st_contains(
                    c.geom, 
                    st_setsrid(st_makepoint(l.longitude, l.latitude), 4326)
                )
                group by c.ct_name, c.pr_name
            )
            select 
                city_name,
                province_name,
                first_visit_time,
                last_visit_time,
                total_points,
                visit_days,
                round(avg_altitude::numeric, 2)::float8 as avg_altitude,
                round(avg_speed::numeric, 2)::float8 as avg_speed,
                rank() over (order by first_visit_time) as visit_order,
                rank() over (order by total_points desc) as frequency_rank
            from city_stats
            order by first_visit_time
            "#,
        )
        .fetch_all(&self.pool)
        .await;

        match &result {
            Ok(stats) => println!("城市统计数据查询成功，共{}个城市", stats.len()),
            Err(e) => println!("城市统计数据查询失败: {:?}", e),
        }

        let stats = result.map(|rows| {
            rows.into_iter()
                .map(|row| CityStats {
                    city_name: row.get("city_name"),
                    province_name: row.get("province_name"),
                    first_visit_time: row.get("first_visit_time"),
                    last_visit_time: row.get("last_visit_time"),
                    total_points: row.get("total_points"),
                    visit_days: row.get("visit_days"),
                    avg_altitude: row.get("avg_altitude"),
                    avg_speed: row.get("avg_speed"),
                    visit_order: row.get("visit_order"),
                    frequency_rank: row.get("frequency_rank"),
                })
                .collect()
        });
        stats
    }

    pub async fn get_daily_stats(&self) -> Result<Vec<DailyStats>, sqlx::Error> {
        let result = sqlx::query(
            r#"
        with daily_stats as (
            select 
                case 
                    when extract(dow from to_timestamp(l.data_time)) in (0, 6) then 'weekend'
                    else 'workday'
                end as day_type,
                c.ct_name as city_name,
                c.pr_name as province_name,
                count(*) as total_points,
                count(distinct date(to_timestamp(l.data_time))) as days_count,
                round(cast(avg(l.speed) as numeric), 2)::float8 as avg_speed,
                round(cast(avg(l.altitude) as numeric), 2)::float8 as avg_altitude,
                round(cast(sum(coalesce(l.distance, 0)) as numeric), 2)::float8 as total_distance
            from lifetime l
            join china_cities c on st_contains(
                c.geom, 
                st_setsrid(st_makepoint(l.longitude, l.latitude), 4326)
            )
            where c.ct_name in ('北京城区', '常州市', '张家口市')
            group by 
                day_type,
                c.ct_name,
                c.pr_name
        )
        select 
            day_type,
            city_name,
            province_name,
            total_points,
            days_count,
            avg_speed,
            avg_altitude,
            total_distance,
            round(cast(
                case 
                    when days_count = 0 then 0 
                    else total_distance / days_count 
                end 
                as numeric
            ), 2)::float8 as distance_per_day,
            rank() over (
                partition by day_type 
                order by total_points desc
            ) as activity_rank
        from daily_stats
        order by 
            day_type,
            total_points desc;
        "#,
        )
        .map(|row: sqlx::postgres::PgRow| DailyStats {
            day_type: row.get("day_type"),
            city_name: row.get("city_name"),
            province_name: row.get("province_name"),
            total_points: row.get("total_points"),
            days_count: row.get("days_count"),
            avg_speed: row.get("avg_speed"),
            avg_altitude: row.get("avg_altitude"),
            total_distance: row.get("total_distance"),
            distance_per_day: row.get("distance_per_day"),
            activity_rank: row.get("activity_rank"),
        })
        .fetch_all(&self.pool)
        .await;

        match &result {
            Ok(stats) => {
                let workday_stats: Vec<_> =
                    stats.iter().filter(|s| s.day_type == "workday").collect();
                let weekend_stats: Vec<_> =
                    stats.iter().filter(|s| s.day_type == "weekend").collect();
                println!(
                    "工作日/周末统计数据查询成功，工作日{}个城市，周末{}个城市",
                    workday_stats.len(),
                    weekend_stats.len()
                );
            }
            Err(e) => println!("工作日/周末统计数据查询失败: {:?}", e),
        }

        result
    }
}
