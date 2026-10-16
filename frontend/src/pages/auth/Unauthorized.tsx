import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 mb-6">
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Access Denied
        </h1>
        <p className="mt-4 text-base tracking-tight text-gray-500">
          You don't have permission to access the requested page. If you believe
          this is an error, please contact your school administrator.
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-5 w-5" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
