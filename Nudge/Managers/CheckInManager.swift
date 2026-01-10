import Foundation
import SwiftData
import SwiftUI

@Observable
class CheckInManager {
    var mood: Int = 3
    var energy: Int = 3
    var focus: Int = 3
    var sleepHours: Double = 7.0
    var note: String = ""

    var isSaving: Bool = false
    var showSavedConfirmation: Bool = false

    func reset() {
        mood = 3
        energy = 3
        focus = 3
        sleepHours = 7.0
        note = ""
    }

    func saveCheckIn(context: ModelContext) {
        isSaving = true

        let today = Calendar.current.startOfDay(for: Date())
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!

        // Check for existing check-in today
        let descriptor = FetchDescriptor<CheckIn>(
            predicate: #Predicate { $0.date >= today && $0.date < tomorrow }
        )

        do {
            let existing = try context.fetch(descriptor)

            if let existingCheckIn = existing.first {
                // Update existing
                existingCheckIn.mood = mood
                existingCheckIn.energy = energy
                existingCheckIn.focus = focus
                existingCheckIn.sleepHours = sleepHours
                existingCheckIn.note = note
            } else {
                // Create new
                let checkIn = CheckIn(
                    mood: mood,
                    energy: energy,
                    focus: focus,
                    sleepHours: sleepHours,
                    note: note
                )
                context.insert(checkIn)
            }

            try context.save()
            showSavedConfirmation = true

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
                self?.isSaving = false
            }
        } catch {
            isSaving = false
            print("Failed to save check-in: \(error)")
        }
    }

    func hasCheckedInToday(context: ModelContext) -> Bool {
        let today = Calendar.current.startOfDay(for: Date())
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!

        let descriptor = FetchDescriptor<CheckIn>(
            predicate: #Predicate { $0.date >= today && $0.date < tomorrow }
        )

        do {
            let existing = try context.fetch(descriptor)
            return !existing.isEmpty
        } catch {
            return false
        }
    }

    func loadTodayIfExists(context: ModelContext) {
        let today = Calendar.current.startOfDay(for: Date())
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!

        let descriptor = FetchDescriptor<CheckIn>(
            predicate: #Predicate { $0.date >= today && $0.date < tomorrow }
        )

        do {
            if let existing = try context.fetch(descriptor).first {
                mood = existing.mood
                energy = existing.energy
                focus = existing.focus
                sleepHours = existing.sleepHours
                note = existing.note
            }
        } catch {
            print("Failed to load existing check-in: \(error)")
        }
    }
}

// MARK: - Statistics
extension CheckInManager {
    static func getRecentCheckIns(context: ModelContext, days: Int = 7) -> [CheckIn] {
        let startDate = Calendar.current.date(byAdding: .day, value: -days, to: Date())!

        var descriptor = FetchDescriptor<CheckIn>(
            predicate: #Predicate { $0.date >= startDate },
            sortBy: [SortDescriptor(\.date, order: .forward)]
        )
        descriptor.fetchLimit = days

        do {
            return try context.fetch(descriptor)
        } catch {
            return []
        }
    }

    static func getCheckInsForMonth(context: ModelContext, date: Date) -> [CheckIn] {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: date)
        guard let startOfMonth = calendar.date(from: components),
              let endOfMonth = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startOfMonth) else {
            return []
        }

        let descriptor = FetchDescriptor<CheckIn>(
            predicate: #Predicate { $0.date >= startOfMonth && $0.date <= endOfMonth },
            sortBy: [SortDescriptor(\.date, order: .forward)]
        )

        do {
            return try context.fetch(descriptor)
        } catch {
            return []
        }
    }

    static func getAllCheckIns(context: ModelContext) -> [CheckIn] {
        let descriptor = FetchDescriptor<CheckIn>(
            sortBy: [SortDescriptor(\.date, order: .forward)]
        )

        do {
            return try context.fetch(descriptor)
        } catch {
            return []
        }
    }

    static func exportToCSV(context: ModelContext) -> String {
        let checkIns = getAllCheckIns(context: context)

        var csv = "Date,Mood,Energy,Focus,Sleep Hours,Note\n"

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"

        for checkIn in checkIns {
            let dateStr = dateFormatter.string(from: checkIn.date)
            let escapedNote = checkIn.note.replacingOccurrences(of: "\"", with: "\"\"")
            csv += "\(dateStr),\(checkIn.mood),\(checkIn.energy),\(checkIn.focus),\(checkIn.sleepHours),\"\(escapedNote)\"\n"
        }

        return csv
    }
}
