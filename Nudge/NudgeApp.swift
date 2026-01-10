import SwiftUI
import SwiftData
import UserNotifications

@main
struct NudgeApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([CheckIn.self])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        MenuBarExtra {
            MenuBarView()
                .modelContainer(sharedModelContainer)
        } label: {
            Image(systemName: "heart.circle.fill")
                .symbolRenderingMode(.hierarchical)
        }
        .menuBarExtraStyle(.menu)

        Window("Check In", id: "checkin") {
            CheckInWindow()
                .modelContainer(sharedModelContainer)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultPosition(.center)

        Window("Dashboard", id: "dashboard") {
            DashboardView()
                .modelContainer(sharedModelContainer)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultSize(width: 680, height: 560)

        Settings {
            SettingsView()
                .modelContainer(sharedModelContainer)
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var scheduledTimer: Timer?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Hide dock icon - menu bar app only
        NSApp.setActivationPolicy(.accessory)

        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }

        // Schedule daily check-in
        scheduleNextCheckIn()

        // Listen for settings changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(rescheduleCheckIn),
            name: .reminderSettingsChanged,
            object: nil
        )
    }

    @objc func rescheduleCheckIn() {
        scheduledTimer?.invalidate()
        scheduleNextCheckIn()
    }

    func scheduleNextCheckIn() {
        guard UserDefaults.standard.bool(forKey: "dailyReminderEnabled") else { return }

        let reminderHour = UserDefaults.standard.integer(forKey: "reminderHour")
        let reminderMinute = UserDefaults.standard.integer(forKey: "reminderMinute")

        let hour = reminderHour == 0 ? 20 : reminderHour
        let minute = reminderMinute == 0 && reminderHour == 0 ? 30 : reminderMinute

        var components = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        components.hour = hour
        components.minute = minute

        guard var targetDate = Calendar.current.date(from: components) else { return }

        if targetDate <= Date() {
            targetDate = Calendar.current.date(byAdding: .day, value: 1, to: targetDate) ?? targetDate
        }

        let interval = targetDate.timeIntervalSince(Date())

        scheduledTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: false) { [weak self] _ in
            DispatchQueue.main.async {
                self?.triggerCheckIn()
                self?.scheduleNextCheckIn()
            }
        }
    }

    @MainActor
    func triggerCheckIn() {
        // Open check-in window via notification
        NotificationCenter.default.post(name: .openCheckInWindow, object: nil)
    }
}

extension Notification.Name {
    static let openCheckInWindow = Notification.Name("openCheckInWindow")
    static let reminderSettingsChanged = Notification.Name("reminderSettingsChanged")
}
