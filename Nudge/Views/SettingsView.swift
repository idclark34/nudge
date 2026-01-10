import SwiftUI
import SwiftData
import ServiceManagement

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext

    @AppStorage("dailyReminderEnabled") private var dailyReminderEnabled = true
    @AppStorage("reminderHour") private var reminderHour = 20
    @AppStorage("reminderMinute") private var reminderMinute = 30

    @State private var launchAtLogin = false
    @State private var showingExportSuccess = false
    @State private var selectedTime = Date()

    var body: some View {
        Form {
            Section {
                Toggle("Daily reminder", isOn: $dailyReminderEnabled)
                    .onChange(of: dailyReminderEnabled) { _, _ in
                        NotificationCenter.default.post(name: .reminderSettingsChanged, object: nil)
                    }

                if dailyReminderEnabled {
                    DatePicker(
                        "Reminder time",
                        selection: $selectedTime,
                        displayedComponents: .hourAndMinute
                    )
                    .onChange(of: selectedTime) { _, newValue in
                        let components = Calendar.current.dateComponents([.hour, .minute], from: newValue)
                        reminderHour = components.hour ?? 20
                        reminderMinute = components.minute ?? 30
                        NotificationCenter.default.post(name: .reminderSettingsChanged, object: nil)
                    }
                }
            } header: {
                Text("Reminders")
            }

            Section {
                Toggle("Launch at login", isOn: $launchAtLogin)
                    .onChange(of: launchAtLogin) { _, newValue in
                        setLaunchAtLogin(enabled: newValue)
                    }
            } header: {
                Text("Startup")
            }

            Section {
                Button("Export data as CSV...") {
                    exportCSV()
                }
            } header: {
                Text("Data")
            }
        }
        .formStyle(.grouped)
        .frame(width: 400, height: 260)
        .onAppear {
            // Initialize time picker with stored values
            var components = DateComponents()
            components.hour = reminderHour
            components.minute = reminderMinute
            if let date = Calendar.current.date(from: components) {
                selectedTime = date
            }

            // Check current launch at login state
            launchAtLogin = SMAppService.mainApp.status == .enabled
        }
        .alert("Exported!", isPresented: $showingExportSuccess) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("Your check-in data has been exported successfully.")
        }
    }

    private func setLaunchAtLogin(enabled: Bool) {
        do {
            if enabled {
                try SMAppService.mainApp.register()
            } else {
                try SMAppService.mainApp.unregister()
            }
        } catch {
            print("Failed to update launch at login: \(error)")
        }
    }

    private func exportCSV() {
        let csv = CheckInManager.exportToCSV(context: modelContext)

        let savePanel = NSSavePanel()
        savePanel.allowedContentTypes = [.commaSeparatedText]
        savePanel.nameFieldStringValue = "nudge-export-\(formattedDate()).csv"
        savePanel.title = "Export Check-in Data"

        savePanel.begin { response in
            if response == .OK, let url = savePanel.url {
                do {
                    try csv.write(to: url, atomically: true, encoding: .utf8)
                    showingExportSuccess = true
                } catch {
                    print("Failed to export: \(error)")
                }
            }
        }
    }

    private func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}

#Preview {
    SettingsView()
        .modelContainer(for: CheckIn.self, inMemory: true)
}
