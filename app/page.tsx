import SmartCourtPortal from "../components/smart-court-portal"
import { ErrorBoundary } from "../components/error-boundary"
import { ProtectedRoute } from "../components/protected-route"

export default function Page() {
  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <SmartCourtPortal />
      </ProtectedRoute>
    </ErrorBoundary>
  )
}
