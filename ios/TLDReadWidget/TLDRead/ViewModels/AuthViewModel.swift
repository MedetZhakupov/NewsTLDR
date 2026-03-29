import Foundation
import GoogleSignIn

@Observable
@MainActor
final class AuthViewModel {
    private let authService = GoogleAuthService.shared

    var isSignedIn: Bool { authService.isSignedIn }
    var isLoading = false
    var errorMessage: String?
    var userName: String? { authService.currentUser?.profile?.name }
    var userEmail: String? { authService.currentUser?.profile?.email }

    func checkExistingSession() async {
        isLoading = true
        _ = await authService.restorePreviousSignIn()
        isLoading = false
    }

    func signIn() async {
        isLoading = true
        errorMessage = nil

        do {
            try await authService.signIn()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func signOut() {
        authService.signOut()
        SharedDataStore.shared.clearAll()
    }
}
