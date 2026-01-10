import Foundation
import SwiftData

@Model
final class CheckIn {
    @Attribute(.unique) var id: UUID
    var date: Date
    var mood: Int // 1-5
    var energy: Int // 1-5
    var focus: Int // 1-5
    var sleepHours: Double
    var note: String
    var createdAt: Date

    init(
        id: UUID = UUID(),
        date: Date = Date(),
        mood: Int = 3,
        energy: Int = 3,
        focus: Int = 3,
        sleepHours: Double = 7.0,
        note: String = "",
        createdAt: Date = Date()
    ) {
        self.id = id
        self.date = date
        self.mood = mood
        self.energy = energy
        self.focus = focus
        self.sleepHours = sleepHours
        self.note = note
        self.createdAt = createdAt
    }
}

extension CheckIn {
    var moodEmoji: String {
        switch mood {
        case 1: return "😞"
        case 2: return "😐"
        case 3: return "🙂"
        case 4: return "😀"
        case 5: return "🤩"
        default: return "🙂"
        }
    }

    var dayOfWeek: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }

    var shortDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }

    static var preview: CheckIn {
        CheckIn(
            mood: 4,
            energy: 3,
            focus: 4,
            sleepHours: 7.5,
            note: "Productive day!"
        )
    }
}
