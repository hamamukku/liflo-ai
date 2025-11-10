import { Navigate } from "react-router-dom";
import { useAuth } from "../../../providers/AuthProvider";

interface Props {
  children: JSX.Element;
}

export const ProtectedRoute = ({ children }: Props) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-liflo-light text-gray-700">
        認証情報を確認しています...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
