import { Link } from "react-router";

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Access denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to view this page. If you are a platform administrator, sign in from the
          platform admin login.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex justify-center px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted"
          >
            Home
          </Link>
          <Link
            to="/platform-admin/login"
            className="inline-flex justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Platform admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
