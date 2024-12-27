import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import CountUp from "react-countup";
import { CityStats, DailyStats } from "./type";
import { useState } from "react"; // @ts-ignore
import { TagCloud } from "react-tagcloud";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cityData?: CityStats[];
  dailyData?: DailyStats[];
}

const Modal = ({ isOpen, onClose, cityData = [], dailyData = [] }: Props) => {
  const [selectedTab, setSelectedTab] = useState<
    "ranking" | "timeline" | "daily" | "cloud"
  >("ranking");

  if (!isOpen) return null;

  const sortedByTime = [...cityData].sort(
    (a, b) => a.first_visit_time - b.first_visit_time
  );
  const sortedByFrequency = [...cityData].sort(
    (a, b) => b.total_points - a.total_points
  );

  const getRandomColor = () => {
    const colors = [
      "#FF6B6B",
      "#FF8C42",
      "#FFA07A",
      "#FF7F50",
      "#FF4500",
      "#FF6347",
      "#E74C3C",
      "#D35400",
      "#3498DB",
      "#2980B9",
      "#4B89DC",
      "#5DADE2",
      "#1ABC9C",
      "#FF5733",
      "#FF8533",
      "#FF4D4D",
      "#4169E1",
      "#FF7F50",
      "#FF6B6B",
      "#4682B4",
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  };

  const cloudData = cityData.map((city) => {
    const maxPoints = Math.max(...cityData.map((c) => c.total_points));
    const minPoints = Math.min(...cityData.map((c) => c.total_points));

    const logMax = Math.log(maxPoints);
    const logMin = Math.log(minPoints);
    const logCurrent = Math.log(city.total_points);

    const scale = (logCurrent - logMin) / (logMax - logMin);

    return {
      value: city.city_name,
      count: city.total_points,
      province: city.province_name,
      scale: scale,
      color: getRandomColor(),
    };
  });

  const customRenderer = (tag: any) => (
    <motion.span
      key={tag.value}
      whileHover={{ scale: 1.1 }}
      className="inline-block cursor-pointer"
      style={{
        fontSize: `${0.1 + tag.scale * 3}em`,
        display: "inline-block",
        color: tag.color,
      }}
      title={`${tag.province} · ${tag.count}个记录点`}
    >
      {tag.value}
    </motion.span>
  );

  const workdayStats = dailyData.filter((d) => d.day_type === "workday");
  const weekendStats = dailyData.filter((d) => d.day_type === "weekend");

  const getSummary = (stats: DailyStats[]) => ({
    totalDistance: stats.reduce((sum, s) => sum + s.total_distance, 0),
    avgSpeed: stats.reduce((sum, s) => sum + s.avg_speed, 0) / stats.length,
    avgAltitude:
      stats.reduce((sum, s) => sum + s.avg_altitude, 0) / stats.length,
    totalDays: stats.reduce((sum, s) => sum + s.days_count, 0),
    totalPoints: stats.reduce((sum, s) => sum + s.total_points, 0),
    avgDailyDistance:
      stats.reduce((sum, s) => sum + s.distance_per_day * s.days_count, 0) /
      stats.reduce((sum, s) => sum + s.days_count, 0),
  });

  const workdaySummary = getSummary(workdayStats);
  const weekendSummary = getSummary(weekendStats);

  // 处理城市对比数据
  const getCityComparisonData = () => {
    const cities = new Set(dailyData.map((d) => d.city_name));
    return Array.from(cities).map((city) => {
      const workday = dailyData.find(
        (d) => d.city_name === city && d.day_type === "workday"
      ) || {
        avg_speed: 0,
        avg_altitude: 0,
        distance_per_day: 0,
      };
      const weekend = dailyData.find(
        (d) => d.city_name === city && d.day_type === "weekend"
      ) || {
        avg_speed: 0,
        avg_altitude: 0,
        distance_per_day: 0,
      };

      return {
        city: city,
        workdaySpeed: Number(workday.avg_speed.toFixed(2)),
        weekendSpeed: Number(weekend.avg_speed.toFixed(2)),
        workdayAltitude: Number(workday.avg_altitude.toFixed(0)),
        weekendAltitude: Number(weekend.avg_altitude.toFixed(0)),
        workdayDistance: Number((workday.distance_per_day / 1000).toFixed(2)),
        weekendDistance: Number((weekend.distance_per_day / 1000).toFixed(2)),
      };
    });
  };

  // 对数据按照每日距离进行排序
  const sortedWorkdayStats = [...workdayStats].sort(
    (a, b) => b.distance_per_day - a.distance_per_day
  );
  const sortedWeekendStats = [...weekendStats].sort(
    (a, b) => b.distance_per_day - a.distance_per_day
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.3,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 300,
          duration: 1,
        }}
        className="bg-gray-900/95 shadow-xl overflow-hidden rounded-lg w-[80vh] h-[80vh] relative"
      >
        <div className="h-full flex flex-col">
          {/* 标题区 */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-100">
                Through Life 时光便签
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* 统计概览 */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm">城市数</div>
                <div className="text-2xl font-bold text-orange-500">
                  <CountUp end={cityData.length} duration={1.5} />
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm">总记录点</div>
                <div className="text-2xl font-bold text-orange-500">
                  <CountUp
                    end={cityData.reduce(
                      (sum, city) => sum + city.total_points,
                      0
                    )}
                    separator=","
                    duration={2}
                  />
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm">活跃天数</div>
                <div className="text-2xl font-bold text-orange-500">
                  <CountUp
                    end={cityData.reduce(
                      (sum, city) => sum + city.visit_days,
                      0
                    )}
                    separator=","
                    duration={2}
                  />
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm">最早记录</div>
                <div className="text-2xl font-bold text-orange-500">
                  {dayjs
                    .unix(Math.min(...cityData.map((c) => c.first_visit_time)))
                    .format("YYYY-MM")}
                </div>
              </div>
            </div>
          </div>

          {/* 标签页切换 */}
          <div className="flex gap-4 px-6 py-4">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "ranking"
                  ? "bg-orange-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setSelectedTab("ranking")}
            >
              最多足迹
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "timeline"
                  ? "bg-orange-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setSelectedTab("timeline")}
            >
              最早造访
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "daily"
                  ? "bg-orange-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setSelectedTab("daily")}
            >
              生活时钟
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === "cloud"
                  ? "bg-orange-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setSelectedTab("cloud")}
            >
              城市词云
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              {selectedTab === "ranking" ? (
                <motion.div
                  key="ranking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {sortedByFrequency.map((city, index) => (
                    <motion.div
                      key={city.city_name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{
                        scale: 1.01,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        },
                      }}
                      whileTap={{ scale: 1 }}
                      className="bg-gray-800/30 rounded-lg p-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            index < 3 ? "bg-orange-600" : "bg-gray-700"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="text-gray-100">{city.city_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-gray-400">记录点</div>
                          <div className="text-orange-500">
                            <CountUp
                              end={city.total_points}
                              separator=","
                              duration={1}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">活跃天数</div>
                          <div className="text-orange-500">
                            <CountUp end={city.visit_days} duration={1} />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">平均海拔</div>
                          <div className="text-orange-500">
                            <CountUp
                              end={city.avg_altitude}
                              decimals={2}
                              duration={1}
                            />
                            m
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">平均速度</div>
                          <div className="text-orange-500">
                            <CountUp
                              end={city.avg_speed}
                              decimals={2}
                              duration={1}
                            />
                            m/s
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : selectedTab === "timeline" ? (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {sortedByTime.map((city, index) => (
                    <motion.div
                      key={city.city_name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/30 rounded-lg p-4 flex items-center gap-4 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-medium text-gray-100">
                            {city.city_name}
                          </span>
                          <span className="text-sm text-gray-400">
                            {city.province_name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          首次到访：
                          {dayjs
                            .unix(city.first_visit_time)
                            .format("YYYY-MM-DD")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-orange-500 font-medium">
                          <CountUp end={city.visit_days} duration={1} /> 天
                        </div>
                        <div className="text-sm text-gray-400">
                          <CountUp
                            end={city.total_points}
                            separator=","
                            duration={1}
                          />{" "}
                          个记录
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : selectedTab === "daily" ? (
                <motion.div
                  key="daily"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8 p-6"
                >
                  {/* 对比概览 */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* 工作日卡片 */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gray-800/30 rounded-xl p-6 space-y-4"
                    >
                      <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        工作日点滴
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-400 text-sm">总距离</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={workdaySummary.totalDistance / 1000}
                              decimals={0}
                              suffix=" km"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">
                            日均移动距离
                          </div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={workdaySummary.avgDailyDistance}
                              decimals={0}
                              suffix=" m"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">活跃天数</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp end={workdaySummary.totalDays} />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">
                            轨迹点总数
                          </div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={workdaySummary.totalPoints}
                              separator=","
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">平均速度</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={workdaySummary.avgSpeed}
                              decimals={1}
                              suffix=" m/s"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">平均海拔</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={workdaySummary.avgAltitude}
                              decimals={0}
                              suffix=" m"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* 周末卡片 */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gray-800/30 rounded-xl p-6 space-y-4"
                    >
                      <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        周末点滴
                      </h3>
                      {/* 周末数据，结构同工作日 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-400 text-sm">总距离</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={weekendSummary.totalDistance / 1000}
                              decimals={0}
                              suffix=" km"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">
                            日均移动距离
                          </div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={weekendSummary.avgDailyDistance}
                              decimals={0}
                              suffix=" m"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">活跃天数</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp end={weekendSummary.totalDays} />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">轨迹点数</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={weekendSummary.totalPoints}
                              separator=","
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">平均速度</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={weekendSummary.avgSpeed}
                              decimals={1}
                              suffix=" m/s"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">平均海拔</div>
                          <div className="text-2xl font-bold text-orange-500">
                            <CountUp
                              end={weekendSummary.avgAltitude}
                              decimals={0}
                              suffix=" m"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* 城市对比图表 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 space-y-8"
                  >
                    <h3 className="text-xl font-semibold text-gray-100 -mb-4">
                      我的每周生活时光
                    </h3>

                    {/* 速度对比图 */}
                    <div className="bg-gray-800/30 rounded-xl p-6">
                      <h4 className="text-lg font-medium text-gray-200 mb-4">
                        日均移动速度 (m/s)
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={getCityComparisonData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="city" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              border: "none",
                              borderRadius: "4px",
                              color: "white",
                            }}
                            cursor={false}
                          />
                          <Legend />
                          <Bar
                            dataKey="workdaySpeed"
                            name="工作日"
                            fill="#f97316"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="weekendSpeed"
                            name="周末"
                            fill="#fb923c"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 海拔对比图 */}
                    <div className="bg-gray-800/30 rounded-xl p-6">
                      <h4 className="text-lg font-medium text-gray-200 mb-4">
                        平均海拔高度 (m)
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={getCityComparisonData()}>
                          <PolarGrid stroke="#444" />
                          <PolarAngleAxis dataKey="city" stroke="#888" />
                          <PolarRadiusAxis stroke="#888" />
                          <Radar
                            name="工作日"
                            dataKey="workdayAltitude"
                            stroke="#f97316"
                            fill="#f97316"
                            fillOpacity={0.3}
                          />
                          <Radar
                            name="周末"
                            dataKey="weekendAltitude"
                            stroke="#fb923c"
                            fill="#fb923c"
                            fillOpacity={0.3}
                          />
                          <Legend />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              border: "none",
                              borderRadius: "4px",
                              color: "white",
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 日均距离对比图 */}
                    <div className="bg-gray-800/30 rounded-xl p-6">
                      <h4 className="text-lg font-medium text-gray-200 mb-4">
                        日均移动距离 (km)
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={getCityComparisonData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="city" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              border: "none",
                              borderRadius: "4px",
                              color: "white",
                            }}
                            cursor={false}
                          />
                          <Legend />
                          <Bar
                            dataKey="workdayDistance"
                            name="工作日"
                            fill="#f97316"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="weekendDistance"
                            name="周末"
                            fill="#fb923c"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* 城市活动排行 */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* 工作日城市排行 */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-4"
                    >
                      <h4 className="text-lg font-medium text-gray-200">
                        工作日足迹
                      </h4>
                      <div className="space-y-3">
                        {sortedWorkdayStats.slice(0, 5).map((city, index) => (
                          <motion.div
                            key={city.city_name}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="bg-gray-800/20 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    index < 3 ? "bg-orange-600" : "bg-gray-700"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="text-gray-100">
                                    {city.city_name}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {city.province_name}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-orange-500">
                                  <CountUp
                                    end={city.distance_per_day}
                                    decimals={1}
                                    suffix=" m/天"
                                  />
                                </div>
                                <div className="text-sm text-gray-400">
                                  {city.avg_speed} m/s
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* 周末城市排行 */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-4"
                    >
                      <h4 className="text-lg font-medium text-gray-200">
                        周末足迹
                      </h4>
                      <div className="space-y-3">
                        {sortedWeekendStats.slice(0, 5).map((city, index) => (
                          <motion.div
                            key={city.city_name}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="bg-gray-800/20 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    index < 3 ? "bg-orange-600" : "bg-gray-700"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="text-gray-100">
                                    {city.city_name}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {city.province_name}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-orange-500">
                                  <CountUp
                                    end={city.distance_per_day}
                                    decimals={1}
                                    suffix=" km/天"
                                  />
                                </div>
                                <div className="text-sm text-gray-400">
                                  {city.avg_speed} m/s
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="cloud"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="bg-gray-800/30 rounded-2xl p-8 w-full h-full">
                    <TagCloud
                      tags={cloudData}
                      renderer={customRenderer}
                      className="flex flex-wrap justify-center items-center gap-4"
                    />

                    {/* 图例说明 */}
                    <div className="mt-20 text-center text-sm text-gray-400 h-20">
                      <p>字体大小代表记录点数量，悬停可查看详细信息</p>
                      <div className="my-2 flex justify-center gap-4">
                        <span>
                          最多记录：
                          {cloudData.reduce(
                            (max, tag) => Math.max(max, tag.count),
                            0
                          )}{" "}
                          个点
                        </span>
                        <span>
                          最少记录：
                          {cloudData.reduce(
                            (min, tag) => Math.min(min, tag.count),
                            Infinity
                          )}{" "}
                          个点
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;
