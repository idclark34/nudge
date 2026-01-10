import SwiftUI
import SwiftData

struct CheckInWindow: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var manager = CheckInManager()
    @State private var currentStep = 0
    @State private var showSaved = false
    @State private var appeared = false
    @State private var dismissing = false

    private let steps = ["mood", "energy", "focus", "sleep", "note"]

    private var stepColor: Color {
        switch currentStep {
        case 0:
            // Mood: gray-blue (sad) → coral → bright orange (happy)
            let t = Double(manager.mood - 1) / 4.0
            return Color(
                red: 0.5 + 0.5 * t,
                green: 0.4 + 0.25 * t,
                blue: 0.7 - 0.4 * t
            )
        case 1:
            // Energy: muted teal (low) → electric blue (high)
            let t = Double(manager.energy - 1) / 4.0
            return Color(
                red: 0.3 - 0.1 * t,
                green: 0.5 + 0.3 * t,
                blue: 0.7 + 0.3 * t
            )
        case 2:
            // Focus: soft lavender (scattered) → vivid purple (locked in)
            let t = Double(manager.focus - 1) / 4.0
            return Color(
                red: 0.5 + 0.25 * t,
                green: 0.35 - 0.1 * t,
                blue: 0.65 + 0.35 * t
            )
        case 3:
            // Sleep: warm amber (little sleep) → deep teal (well rested)
            let t = min(max((manager.sleepHours - 4) / 5.0, 0), 1)
            return Color(
                red: 0.9 - 0.5 * t,
                green: 0.5 + 0.3 * t,
                blue: 0.3 + 0.5 * t
            )
        case 4:
            // Note: warm golden
            return Color(red: 1.0, green: 0.75, blue: 0.4)
        default:
            return .accentColor
        }
    }

    private var stepTitle: String {
        switch currentStep {
        case 0: return "How are you feeling?"
        case 1: return "Energy level?"
        case 2: return "How focused were you?"
        case 3: return "Hours of sleep?"
        case 4: return "Anything notable?"
        default: return ""
        }
    }

    var body: some View {
        ZStack {
            if showSaved {
                // Saved confirmation
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 32, weight: .medium))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
                    Text("Done!")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.2), radius: 2, y: 1)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(
                    ZStack {
                        VisualEffectView(material: .hudWindow, blendingMode: .behindWindow)
                        Color.green.opacity(0.7)
                        LinearGradient(
                            colors: [.white.opacity(0.3), .clear],
                            startPoint: .top,
                            endPoint: .center
                        )
                    }
                )
            } else {
                VStack(spacing: 0) {
                    // Progress dots
                    HStack(spacing: 6) {
                        ForEach(0..<5) { index in
                            Circle()
                                .fill(index == currentStep ? .white : .white.opacity(0.4))
                                .frame(width: 6, height: 6)
                        }
                    }
                    .padding(.top, 14)

                    Spacer()

                    // Question
                    Text(stepTitle)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(.bottom, 16)

                    // Input for current step
                    Group {
                        switch currentStep {
                        case 0:
                            MoodPicker(value: $manager.mood)
                        case 1:
                            EnergyPicker(value: $manager.energy)
                        case 2:
                            FocusPicker(value: $manager.focus)
                        case 3:
                            SleepPicker(hours: $manager.sleepHours)
                        case 4:
                            NoteField(text: $manager.note)
                        default:
                            EmptyView()
                        }
                    }

                    Spacer()

                    // Navigation
                    HStack(spacing: 12) {
                        if currentStep > 0 {
                            Button {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                    currentStep -= 1
                                }
                            } label: {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(.white.opacity(0.8))
                                    .frame(width: 36, height: 36)
                                    .background(.white.opacity(0.2), in: Circle())
                            }
                            .buttonStyle(.plain)
                        }

                        Spacer()

                        Button {
                            if currentStep < 4 {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                    currentStep += 1
                                }
                            } else {
                                saveAndDismiss()
                            }
                        } label: {
                            HStack(spacing: 6) {
                                Text(currentStep == 4 ? "Save" : "Next")
                                    .font(.system(size: 14, weight: .semibold))
                                if currentStep < 4 {
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 12, weight: .semibold))
                                }
                            }
                            .foregroundStyle(stepColor)
                            .padding(.horizontal, 18)
                            .padding(.vertical, 10)
                            .background(.white, in: Capsule())
                        }
                        .buttonStyle(.plain)
                        .keyboardShortcut(.return, modifiers: [])
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 14)
                }
                .background(
                    ZStack {
                        // Base blur layer
                        VisualEffectView(material: .hudWindow, blendingMode: .behindWindow)

                        // Vibrant color overlay
                        stepColor.opacity(0.85)

                        // Glossy top shine
                        LinearGradient(
                            colors: [.white.opacity(0.6), .white.opacity(0.2), .clear, .clear],
                            startPoint: .top,
                            endPoint: .center
                        )

                        // Specular highlight blob
                        Ellipse()
                            .fill(
                                RadialGradient(
                                    colors: [.white.opacity(0.5), .clear],
                                    center: .center,
                                    startRadius: 0,
                                    endRadius: 120
                                )
                            )
                            .frame(width: 200, height: 80)
                            .offset(y: -80)
                            .blur(radius: 20)

                        // Bottom depth
                        LinearGradient(
                            colors: [.clear, .clear, .black.opacity(0.15)],
                            startPoint: .top,
                            endPoint: .bottom
                        )

                        // Edge shine left
                        LinearGradient(
                            colors: [.white.opacity(0.3), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                        .frame(width: 60)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .blur(radius: 10)
                    }
                )
                .animation(.easeInOut(duration: 0.4), value: manager.mood)
                .animation(.easeInOut(duration: 0.4), value: manager.energy)
                .animation(.easeInOut(duration: 0.4), value: manager.focus)
                .animation(.easeInOut(duration: 0.4), value: manager.sleepHours)
            }

            // Close button
            VStack {
                HStack {
                    Spacer()
                    Button {
                        animateDismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 28, height: 28)
                            .background(.black.opacity(0.2), in: Circle())
                            .contentShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .padding(8)
                }
                Spacer()
            }
        }
        .frame(width: 280, height: 260)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(
                    LinearGradient(
                        colors: [.white.opacity(0.8), .white.opacity(0.3), .white.opacity(0.1)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1.5
                )
        )
        .overlay(
            // Top edge highlight
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(.white.opacity(0.4), lineWidth: 1)
                .blur(radius: 1)
                .mask(
                    LinearGradient(
                        colors: [.white, .clear],
                        startPoint: .top,
                        endPoint: .center
                    )
                )
        )
        .shadow(color: .black.opacity(0.35), radius: 30, x: 0, y: 15)
        .shadow(color: stepColor.opacity(0.5), radius: 50, x: 0, y: 10)
        .offset(x: appeared ? 0 : 320)
        .scaleEffect(appeared ? 1 : 0.8)
        .opacity(appeared ? 1 : 0)
        .onAppear {
            manager.loadTodayIfExists(context: modelContext)
            positionWindow()
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7, blendDuration: 0)) {
                appeared = true
            }
        }
        .onExitCommand {
            animateDismiss()
        }
    }

    private func positionWindow() {
        DispatchQueue.main.async {
            if let window = NSApp.windows.first(where: { $0.title == "Check In" }) {
                if let screen = NSScreen.main {
                    let screenFrame = screen.visibleFrame
                    let windowFrame = window.frame
                    let x = screenFrame.maxX - windowFrame.width - 20
                    let y = screenFrame.maxY - windowFrame.height - 10
                    window.setFrameOrigin(NSPoint(x: x, y: y))
                    window.level = .floating
                    window.backgroundColor = .clear
                    window.isOpaque = false
                    window.hasShadow = false
                    window.standardWindowButton(.closeButton)?.isHidden = true
                    window.standardWindowButton(.miniaturizeButton)?.isHidden = true
                    window.standardWindowButton(.zoomButton)?.isHidden = true
                    window.isMovableByWindowBackground = false
                    window.isMovable = false
                    window.titlebarAppearsTransparent = true
                    window.titleVisibility = .hidden
                }
            }
        }
    }

    private func saveAndDismiss() {
        manager.saveCheckIn(context: modelContext)

        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            showSaved = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            animateDismiss()
        }
    }

    private func animateDismiss() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            appeared = false
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            dismiss()
        }
    }
}

// MARK: - Mood Picker

struct MoodPicker: View {
    @Binding var value: Int
    private let moods = ["😔", "😕", "😊", "😄", "🤩"]
    private let moodLabels = ["Rough", "Meh", "Okay", "Good", "Great"]

    @State private var dragOffset: CGFloat = 0
    @State private var isDragging = false

    private let sliderWidth: CGFloat = 220
    private let thumbSize: CGFloat = 48

    private var thumbPosition: CGFloat {
        let range = sliderWidth - thumbSize
        return CGFloat(value - 1) / 4.0 * range
    }

    var body: some View {
        VStack(spacing: 10) {
            // Current mood emoji
            Text(moods[value - 1])
                .font(.system(size: 40))
                .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
                .scaleEffect(isDragging ? 1.1 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isDragging)

            Text(moodLabels[value - 1])
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.8))

            // Slider track
            ZStack(alignment: .leading) {
                // Track background
                Capsule()
                    .fill(.white.opacity(0.2))
                    .frame(width: sliderWidth, height: 8)

                // Filled portion
                Capsule()
                    .fill(.white.opacity(0.6))
                    .frame(width: thumbPosition + thumbSize / 2, height: 8)

                // Thumb
                Circle()
                    .fill(.white)
                    .frame(width: thumbSize, height: thumbSize)
                    .shadow(color: .black.opacity(0.25), radius: 8, y: 4)
                    .overlay(
                        Text(moods[value - 1])
                            .font(.system(size: 24))
                    )
                    .offset(x: thumbPosition)
                    .gesture(
                        DragGesture()
                            .onChanged { gesture in
                                isDragging = true
                                let newX = gesture.location.x - thumbSize / 2
                                let clampedX = max(0, min(sliderWidth - thumbSize, newX))
                                let newValue = Int(round(clampedX / (sliderWidth - thumbSize) * 4)) + 1
                                if newValue != value {
                                    withAnimation(.spring(response: 0.2, dampingFraction: 0.7)) {
                                        value = newValue
                                    }
                                }
                            }
                            .onEnded { _ in
                                isDragging = false
                            }
                    )
            }
            .frame(width: sliderWidth, height: thumbSize)
        }
    }
}

// MARK: - Energy Picker

struct EnergyPicker: View {
    @Binding var value: Int

    @State private var isDragging = false

    private let sliderWidth: CGFloat = 220
    private let thumbSize: CGFloat = 44

    private let energyIcons = ["😴", "🥱", "😌", "💪", "⚡️"]
    private let energyLabels = ["Drained", "Tired", "Okay", "Good", "Supercharged"]

    private var thumbPosition: CGFloat {
        let range = sliderWidth - thumbSize
        return CGFloat(value - 1) / 4.0 * range
    }

    var body: some View {
        VStack(spacing: 10) {
            // Current energy display
            Text(energyIcons[value - 1])
                .font(.system(size: 40))
                .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
                .scaleEffect(isDragging ? 1.15 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isDragging)

            Text(energyLabels[value - 1])
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.8))

            // Slider track
            ZStack(alignment: .leading) {
                // Track background
                Capsule()
                    .fill(.white.opacity(0.2))
                    .frame(width: sliderWidth, height: 8)

                // Filled portion with gradient
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.white.opacity(0.4), .white.opacity(0.7)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: thumbPosition + thumbSize / 2, height: 8)

                // Thumb
                Circle()
                    .fill(.white)
                    .frame(width: thumbSize, height: thumbSize)
                    .shadow(color: .black.opacity(0.25), radius: 8, y: 4)
                    .overlay(
                        Text(energyIcons[value - 1])
                            .font(.system(size: 22))
                    )
                    .offset(x: thumbPosition)
                    .gesture(
                        DragGesture()
                            .onChanged { gesture in
                                isDragging = true
                                let newX = gesture.location.x - thumbSize / 2
                                let clampedX = max(0, min(sliderWidth - thumbSize, newX))
                                let newValue = Int(round(clampedX / (sliderWidth - thumbSize) * 4)) + 1
                                if newValue != value {
                                    withAnimation(.spring(response: 0.2, dampingFraction: 0.7)) {
                                        value = newValue
                                    }
                                }
                            }
                            .onEnded { _ in
                                isDragging = false
                            }
                    )
            }
            .frame(width: sliderWidth, height: thumbSize)
        }
    }
}

// MARK: - Focus Picker

struct FocusPicker: View {
    @Binding var value: Int

    @State private var isDragging = false

    private let sliderWidth: CGFloat = 220
    private let thumbSize: CGFloat = 44

    private let focusIcons = ["🌀", "😶‍🌫️", "🤔", "😤", "🎯"]
    private let focusLabels = ["Scattered", "Foggy", "Okay", "Dialed In", "Locked In"]

    private var thumbPosition: CGFloat {
        let range = sliderWidth - thumbSize
        return CGFloat(value - 1) / 4.0 * range
    }

    var body: some View {
        VStack(spacing: 10) {
            // Current focus display
            Text(focusIcons[value - 1])
                .font(.system(size: 40))
                .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
                .scaleEffect(isDragging ? 1.15 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isDragging)

            Text(focusLabels[value - 1])
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.8))

            // Slider track
            ZStack(alignment: .leading) {
                // Track background
                Capsule()
                    .fill(.white.opacity(0.2))
                    .frame(width: sliderWidth, height: 8)

                // Filled portion with gradient
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.white.opacity(0.4), .white.opacity(0.7)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: thumbPosition + thumbSize / 2, height: 8)

                // Thumb
                Circle()
                    .fill(.white)
                    .frame(width: thumbSize, height: thumbSize)
                    .shadow(color: .black.opacity(0.25), radius: 8, y: 4)
                    .overlay(
                        Text(focusIcons[value - 1])
                            .font(.system(size: 22))
                    )
                    .offset(x: thumbPosition)
                    .gesture(
                        DragGesture()
                            .onChanged { gesture in
                                isDragging = true
                                let newX = gesture.location.x - thumbSize / 2
                                let clampedX = max(0, min(sliderWidth - thumbSize, newX))
                                let newValue = Int(round(clampedX / (sliderWidth - thumbSize) * 4)) + 1
                                if newValue != value {
                                    withAnimation(.spring(response: 0.2, dampingFraction: 0.7)) {
                                        value = newValue
                                    }
                                }
                            }
                            .onEnded { _ in
                                isDragging = false
                            }
                    )
            }
            .frame(width: sliderWidth, height: thumbSize)
        }
    }
}

// MARK: - Rating Picker (unused but kept for compatibility)

struct RatingPicker: View {
    @Binding var value: Int
    let color: Color

    @State private var isDragging = false

    private let sliderWidth: CGFloat = 220
    private let thumbSize: CGFloat = 40

    private var thumbPosition: CGFloat {
        let range = sliderWidth - thumbSize
        return CGFloat(value - 1) / 4.0 * range
    }

    var body: some View {
        VStack(spacing: 12) {
            // Current value display
            Text("\(value)")
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
                .scaleEffect(isDragging ? 1.15 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isDragging)

            // Slider track
            ZStack(alignment: .leading) {
                // Track background
                Capsule()
                    .fill(.white.opacity(0.2))
                    .frame(width: sliderWidth, height: 8)

                // Filled portion
                Capsule()
                    .fill(.white.opacity(0.6))
                    .frame(width: thumbPosition + thumbSize / 2, height: 8)

                // Tick marks
                HStack(spacing: 0) {
                    ForEach(1...5, id: \.self) { i in
                        Circle()
                            .fill(i <= value ? .white : .white.opacity(0.3))
                            .frame(width: 6, height: 6)
                        if i < 5 {
                            Spacer()
                        }
                    }
                }
                .frame(width: sliderWidth - 20)
                .offset(x: 10)

                // Thumb
                Circle()
                    .fill(.white)
                    .frame(width: thumbSize, height: thumbSize)
                    .shadow(color: .black.opacity(0.25), radius: 8, y: 4)
                    .overlay(
                        Text("\(value)")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundStyle(color)
                    )
                    .offset(x: thumbPosition)
                    .gesture(
                        DragGesture()
                            .onChanged { gesture in
                                isDragging = true
                                let newX = gesture.location.x - thumbSize / 2
                                let clampedX = max(0, min(sliderWidth - thumbSize, newX))
                                let newValue = Int(round(clampedX / (sliderWidth - thumbSize) * 4)) + 1
                                if newValue != value {
                                    withAnimation(.spring(response: 0.2, dampingFraction: 0.7)) {
                                        value = newValue
                                    }
                                }
                            }
                            .onEnded { _ in
                                isDragging = false
                            }
                    )
            }
            .frame(width: sliderWidth, height: thumbSize)
        }
    }
}

// MARK: - Sleep Picker

struct SleepPicker: View {
    @Binding var hours: Double

    var body: some View {
        VStack(spacing: 16) {
            // Moon icon
            Image(systemName: "moon.zzz.fill")
                .font(.system(size: 32))
                .foregroundStyle(.white.opacity(0.9))
                .shadow(color: .black.opacity(0.2), radius: 4, y: 2)

            // Stepper controls
            HStack(spacing: 20) {
                Button {
                    withAnimation(.spring(response: 0.2, dampingFraction: 0.7)) {
                        hours = max(3, hours - 0.5)
                    }
                } label: {
                    Image(systemName: "minus")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(.white.opacity(0.2), in: Circle())
                }
                .buttonStyle(.plain)

                Text(formatHours(hours))
                    .font(.system(size: 38, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
                    .frame(width: 110)
                    .contentTransition(.numericText())

                Button {
                    withAnimation(.spring(response: 0.2, dampingFraction: 0.7)) {
                        hours = min(12, hours + 0.5)
                    }
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(.white.opacity(0.2), in: Circle())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func formatHours(_ h: Double) -> String {
        let rounded = (h * 2).rounded() / 2 // Ensure clean 0.5 increments
        if rounded == floor(rounded) {
            return "\(Int(rounded))h"
        } else {
            return "\(Int(rounded)).5h"
        }
    }
}

// MARK: - Note Field

struct NoteField: View {
    @Binding var text: String

    var body: some View {
        TextField("Optional...", text: $text)
            .textFieldStyle(.plain)
            .font(.system(size: 14))
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.white.opacity(0.2), in: Capsule())
            .frame(width: 220)
            .onChange(of: text) { _, newValue in
                if newValue.count > 50 {
                    text = String(newValue.prefix(50))
                }
            }
    }
}

// MARK: - Legacy components for Dashboard compatibility

struct MetricRow<Content: View>: View {
    let label: String
    @ViewBuilder let content: Content

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
                .frame(width: 54, alignment: .leading)
            content
        }
    }
}

struct VisualEffectView: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        return view
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 24)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.accentColor)
            )
            .opacity(configuration.isPressed ? 0.85 : 1.0)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(.secondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.primary.opacity(0.05))
            )
            .opacity(configuration.isPressed ? 0.7 : 1.0)
            .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
    }
}

#Preview {
    CheckInWindow()
        .modelContainer(for: CheckIn.self, inMemory: true)
}
