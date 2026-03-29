import SwiftUI

struct SettingsView: View {
    @Bindable var authViewModel: AuthViewModel
    @Bindable var newsletterViewModel: NewsletterViewModel

    @State private var apiKey: String = ""
    @State private var isAPIKeySaved = false
    @State private var refreshInterval: Int = 60
    @State private var showClearConfirmation = false

    private let store = SharedDataStore.shared

    var body: some View {
        Form {
            // Account
            Section("Google Account") {
                if let name = authViewModel.userName {
                    LabeledContent("Name", value: name)
                }
                if let email = authViewModel.userEmail {
                    LabeledContent("Email", value: email)
                }
                Button("Sign Out", role: .destructive) {
                    authViewModel.signOut()
                }
            }

            // Anthropic API
            Section {
                if isAPIKeySaved {
                    HStack {
                        Label("API Key Saved", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Spacer()
                        Button("Change") {
                            isAPIKeySaved = false
                            apiKey = ""
                        }
                        .font(.caption)
                    }
                } else {
                    SecureField("sk-ant-...", text: $apiKey)
                        .textContentType(.password)
                        .autocorrectionDisabled()

                    Button("Save API Key") {
                        guard !apiKey.isEmpty else { return }
                        KeychainHelper.save(apiKey, for: .anthropicAPIKey)
                        isAPIKeySaved = true
                        apiKey = ""
                    }
                    .disabled(apiKey.isEmpty)
                }
            } header: {
                Text("Anthropic API Key")
            } footer: {
                Text("Your API key is stored securely in the iOS Keychain and never leaves your device.")
            }

            // Refresh Interval
            Section("Widget Refresh") {
                Picker("Refresh Interval", selection: $refreshInterval) {
                    Text("30 minutes").tag(30)
                    Text("1 hour").tag(60)
                    Text("2 hours").tag(120)
                    Text("4 hours").tag(240)
                }
                .onChange(of: refreshInterval) { _, newValue in
                    store.refreshIntervalMinutes = newValue
                }
            }

            // Data
            Section("Data") {
                LabeledContent("Cached Summaries", value: "\(newsletterViewModel.tldrs.count)")

                Button("Clear All Cached Data", role: .destructive) {
                    showClearConfirmation = true
                }
            }
        }
        .navigationTitle("Settings")
        .confirmationDialog("Clear all cached summaries?", isPresented: $showClearConfirmation) {
            Button("Clear All", role: .destructive) {
                newsletterViewModel.clearAll()
            }
        }
        .onAppear {
            isAPIKeySaved = KeychainHelper.readString(.anthropicAPIKey) != nil
            refreshInterval = store.refreshIntervalMinutes
        }
    }
}
