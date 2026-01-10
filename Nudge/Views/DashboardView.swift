import SwiftUI
import SwiftData
import Charts

struct DashboardView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \CheckIn.date, order: .reverse) private var allCheckIns: [CheckIn]

    private var recentCheckIns: [CheckIn] {
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        return allCheckIns
            .filter { $0.date >= sevenDaysAgo }
            .sorted { $0.date < $1.date }
    }

    private var todayCheckIn: CheckIn? {
        let today = Calendar.current.startOfDay(for: Date())
        return allCheckIns.first { Calendar.current.isDate($0.date, inSameDayAs: today) }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Dashboard")
                    .font(.system(size: 20, weight: .semibold))

                Spacer()

                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 24)
            .padding(.top, 20)
            .padding(.bottom, 16)

            ScrollView {
                VStack(spacing: 20) {
                    // Today Summary
                    if let today = todayCheckIn {
                        TodaySummaryCard(checkIn: today)
                    } else {
                        EmptyTodayCard()
                    }

                    // Trend Charts
                    if recentCheckIns.count >= 2 {
                        TrendChartCard(title: "Mood", data: recentCheckIns, keyPath: \.mood, color: .orange)
                        TrendChartCard(title: "Energy", data: recentCheckIns, keyPath: \.energy, color: .blue)
                        TrendChartCard(title: "Focus", data: recentCheckIns, keyPath: \.focus, color: .purple)
                    } else {
                        EmptyChartsCard()
                    }

                    // Calendar Grid
                    CheckInCalendarCard(checkIns: allCheckIns)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
        .frame(width: 680, height: 560)
        .background(VisualEffectView(material: .sidebar, blendingMode: .behindWindow))
    }
}

// MARK: - Today Summary

struct TodaySummaryCard: View {
    let checkIn: CheckIn

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Today")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.secondary)

                Spacer()

                Text(checkIn.shortDate)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.tertiary)
            }

            HStack(spacing: 24) {
                MetricBadge(label: "Mood", value: checkIn.moodEmoji, isEmoji: true)
                MetricBadge(label: "Energy", value: "\(checkIn.energy)/5")
                MetricBadge(label: "Focus", value: "\(checkIn.focus)/5")
                MetricBadge(label: "Sleep", value: String(format: "%.1fh", checkIn.sleepHours))

                Spacer()
            }

            if !checkIn.note.isEmpty {
                Text("\"\(checkIn.note)\"")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .italic()
            }
        }
        .padding(20)
        .background(CardBackground())
    }
}

struct EmptyTodayCard: View {
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        VStack(spacing: 12) {
            Text("No check-in yet today")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.secondary)

            Button("Check in now") {
                openWindow(id: "checkin")
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(CardBackground())
    }
}

struct MetricBadge: View {
    let label: String
    let value: String
    var isEmoji: Bool = false

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(isEmoji ? .system(size: 24) : .system(size: 18, weight: .semibold))
                .foregroundStyle(.primary)

            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.tertiary)
        }
    }
}

// MARK: - Trend Charts

struct TrendChartCard: View {
    let title: String
    let data: [CheckIn]
    let keyPath: KeyPath<CheckIn, Int>
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.secondary)

                Spacer()

                if let avg = averageValue {
                    Text("avg: \(String(format: "%.1f", avg))")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.tertiary)
                }
            }

            Chart {
                ForEach(data, id: \.id) { checkIn in
                    LineMark(
                        x: .value("Date", checkIn.date, unit: .day),
                        y: .value(title, checkIn[keyPath: keyPath])
                    )
                    .foregroundStyle(color.gradient)
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: 2))

                    AreaMark(
                        x: .value("Date", checkIn.date, unit: .day),
                        y: .value(title, checkIn[keyPath: keyPath])
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [color.opacity(0.2), color.opacity(0.0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", checkIn.date, unit: .day),
                        y: .value(title, checkIn[keyPath: keyPath])
                    )
                    .foregroundStyle(color)
                    .symbolSize(30)
                }
            }
            .chartYScale(domain: 1...5)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { value in
                    if let date = value.as(Date.self) {
                        AxisValueLabel {
                            Text(date, format: .dateTime.weekday(.abbreviated))
                                .font(.system(size: 10))
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks(values: [1, 3, 5]) { value in
                    AxisValueLabel {
                        if let intValue = value.as(Int.self) {
                            Text("\(intValue)")
                                .font(.system(size: 10))
                        }
                    }
                    AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5, dash: [4]))
                        .foregroundStyle(Color.primary.opacity(0.1))
                }
            }
            .frame(height: 100)
        }
        .padding(20)
        .background(CardBackground())
    }

    private var averageValue: Double? {
        guard !data.isEmpty else { return nil }
        let sum = data.reduce(0) { $0 + $1[keyPath: keyPath] }
        return Double(sum) / Double(data.count)
    }
}

struct EmptyChartsCard: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 28))
                .foregroundStyle(.tertiary)

            Text("Charts appear after 2+ check-ins")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(CardBackground())
    }
}

// MARK: - Calendar Grid

struct CheckInCalendarCard: View {
    let checkIns: [CheckIn]

    private var currentMonth: Date { Date() }

    private var checkInDates: Set<String> {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return Set(checkIns.map { formatter.string(from: $0.date) })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("This Month")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.secondary)

                Spacer()

                let completedDays = checkInsThisMonth
                let totalDays = daysInCurrentMonth
                Text("\(completedDays)/\(totalDays) days")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.tertiary)
            }

            CalendarGrid(checkInDates: checkInDates, month: currentMonth)
        }
        .padding(20)
        .background(CardBackground())
    }

    private var checkInsThisMonth: Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: Date())
        guard let startOfMonth = calendar.date(from: components) else { return 0 }

        return checkIns.filter { calendar.isDate($0.date, equalTo: startOfMonth, toGranularity: .month) }.count
    }

    private var daysInCurrentMonth: Int {
        let calendar = Calendar.current
        let range = calendar.range(of: .day, in: .month, for: Date())
        return range?.count ?? 30
    }
}

struct CalendarGrid: View {
    let checkInDates: Set<String>
    let month: Date

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
    private let weekdays = ["S", "M", "T", "W", "T", "F", "S"]

    var body: some View {
        VStack(spacing: 8) {
            // Weekday headers
            HStack(spacing: 4) {
                ForEach(weekdays, id: \.self) { day in
                    Text(day)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.tertiary)
                        .frame(maxWidth: .infinity)
                }
            }

            // Days grid
            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(daysInMonth(), id: \.self) { day in
                    if day == 0 {
                        Color.clear
                            .frame(height: 24)
                    } else {
                        DayCell(day: day, hasCheckIn: hasCheckIn(for: day), isToday: isToday(day: day))
                    }
                }
            }
        }
    }

    private func daysInMonth() -> [Int] {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: month)
        guard let startOfMonth = calendar.date(from: components),
              let range = calendar.range(of: .day, in: .month, for: startOfMonth) else {
            return []
        }

        let firstWeekday = calendar.component(.weekday, from: startOfMonth)
        let paddingDays = firstWeekday - 1

        var days: [Int] = Array(repeating: 0, count: paddingDays)
        days.append(contentsOf: Array(range))

        return days
    }

    private func hasCheckIn(for day: Int) -> Bool {
        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month], from: month)
        components.day = day
        guard let date = calendar.date(from: components) else { return false }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return checkInDates.contains(formatter.string(from: date))
    }

    private func isToday(day: Int) -> Bool {
        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month], from: month)
        components.day = day
        guard let date = calendar.date(from: components) else { return false }
        return calendar.isDateInToday(date)
    }
}

struct DayCell: View {
    let day: Int
    let hasCheckIn: Bool
    let isToday: Bool

    var body: some View {
        ZStack {
            if hasCheckIn {
                Circle()
                    .fill(Color.accentColor.opacity(0.2))
            }

            if isToday {
                Circle()
                    .strokeBorder(Color.accentColor, lineWidth: 1.5)
            }

            Text("\(day)")
                .font(.system(size: 11, weight: hasCheckIn ? .semibold : .regular))
                .foregroundStyle(hasCheckIn ? .primary : .secondary)
        }
        .frame(height: 24)
    }
}

// MARK: - Shared Components

struct CardBackground: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 12)
            .fill(Color.primary.opacity(0.03))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1)
            )
    }
}

#Preview {
    DashboardView()
        .modelContainer(for: CheckIn.self, inMemory: true)
}
