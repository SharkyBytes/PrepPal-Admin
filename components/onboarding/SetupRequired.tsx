import React, { useState } from 'react';
import Link from 'next/link';

const SetupRequired = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="mt-4 text-center">
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="text-primary-600 underline text-sm"
      >
        {showInstructions ? "Hide setup instructions" : "First time setup? Click here for instructions"}
      </button>

      {showInstructions && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md text-left text-sm">
          <h3 className="font-medium text-blue-800 mb-2">
            First-time Setup Instructions
          </h3>
          <p className="mb-2">
            You need to set up your Supabase project before you can log in:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Supabase Dashboard</a></li>
            <li>Select your project: <code className="bg-blue-100 px-1">dhddcpuojgrszssuuisa</code></li>
            <li>Go to Authentication → Users and create a new user (email/password)</li>
            <li>Set up database tables (exams, subjects, chapters, books)</li>
            <li>Set up Row Level Security policies for these tables</li>
          </ol>
          <p className="mt-2">
            For detailed instructions, see:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><Link href="/setup-docs/setup" target="_blank" className="text-primary-600 underline">Setup Guide</Link> for detailed step-by-step instructions</li>
            <li><Link href="/setup-docs/sql" target="_blank" className="text-primary-600 underline">SQL Script</Link> to create tables and policies quickly</li>
          </ul>
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-xs">
              <strong>Note:</strong> After creating a user in Supabase, you can use those credentials to log in here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupRequired; 