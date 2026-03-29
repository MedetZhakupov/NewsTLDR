import Foundation
import GoogleSignIn

@Observable
final class GoogleAuthService {
    static let shared = GoogleAuthService()

    private let gmailReadOnlyScope = "https://www.googleapis.com/auth/gmail.readonly"

    private(set) var currentUser: GIDGoogleUser?
    private(set) var isSignedIn = false

    var accessToken: String? {
        currentUser?.accessToken.tokenString
    }

    private init() {}

    func restorePreviousSignIn() async -> Bool {
        do {
            let user = try await GIDSignIn.sharedInstance.restorePreviousSignIn()
            if user.grantedScopes?.contains(gmailReadOnlyScope) == true {
                self.currentUser = user
                self.isSignedIn = true
                return true
            } else {
                return await requestGmailScope(user: user)
            }
        } catch {
            self.currentUser = nil
            self.isSignedIn = false
            return false
        }
    }

    @MainActor
    func signIn() async throws {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            throw AuthError.noRootViewController
        }

        let result = try await GIDSignIn.sharedInstance.signIn(
            withPresenting: rootViewController,
            hint: nil,
            additionalScopes: [gmailReadOnlyScope]
        )

        self.currentUser = result.user
        self.isSignedIn = true
    }

    func signOut() {
        GIDSignIn.sharedInstance.signOut()
        currentUser = nil
        isSignedIn = false
    }

    func refreshTokenIfNeeded() async throws {
        guard let user = currentUser else {
            throw AuthError.notSignedIn
        }

        try await user.refreshTokensIfNeeded()
    }

    private func requestGmailScope(user: GIDGoogleUser) async -> Bool {
        guard let windowScene = await UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = await windowScene.windows.first?.rootViewController else {
            return false
        }

        do {
            let result = try await user.addScopes(
                [gmailReadOnlyScope],
                presenting: rootViewController
            )
            self.currentUser = result?.user
            self.isSignedIn = true
            return true
        } catch {
            return false
        }
    }

    enum AuthError: LocalizedError {
        case noRootViewController
        case notSignedIn

        var errorDescription: String? {
            switch self {
            case .noRootViewController:
                return "Unable to find root view controller for sign-in."
            case .notSignedIn:
                return "Not signed in to Google."
            }
        }
    }
}
