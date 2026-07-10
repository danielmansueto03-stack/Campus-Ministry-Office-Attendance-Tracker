import EventCreateForm from "../EventCreateForm"; 
// Note: If EventCreateForm.tsx is located somewhere else (like an app/components folder), 
// adjust the path above accordingly (e.g., "@/components/EventCreateForm")

export default function CreateEventPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create New Event</h1>
          <p className="text-slate-500 text-sm mt-1">
            Fill in the details below to initialize a new live tracking session.
          </p>
        </div>
        
        {/* Your existing form layout */}
        <EventCreateForm />
      </div>
    </div>
  );
}