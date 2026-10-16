import React from "react";
import { Outlet } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-primary-500 text-white rounded-xl shadow-card flex items-center justify-center">
            <GraduationCap className="h-10 w-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome to School MS
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Integrated Education Engagement System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-card border border-gray-100 sm:rounded-xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
