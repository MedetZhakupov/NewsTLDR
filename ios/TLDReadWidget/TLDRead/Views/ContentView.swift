import SwiftUI

struct ContentView: View {
    @State private var authViewModel = AuthViewModel()
    @State private var senderViewModel = SenderViewModel()
    @State private var newsletterViewModel = NewsletterViewModel()

    var body: some View {
        Group {
            if authViewModel.isLoading {
                ProgressView("Checking session...")
            } else if !authViewModel.isSignedIn {
                SignInView(viewModel: authViewModel)
            } else {
                TabView {
                    Tab("TLDRs", systemImage: "doc.text") {
                        NavigationStack {
                            NewsletterListView(viewModel: newsletterViewModel)
                        }
                    }

                    Tab("Senders", systemImage: "envelope.open") {
                        NavigationStack {
                            SenderPickerView(viewModel: senderViewModel)
                        }
                    }

                    Tab("Settings", systemImage: "gear") {
                        NavigationStack {
                            SettingsView(
                                authViewModel: authViewModel,
                                newsletterViewModel: newsletterViewModel
                            )
                        }
                    }
                }
            }
        }
        .task {
            await authViewModel.checkExistingSession()
        }
    }
}
