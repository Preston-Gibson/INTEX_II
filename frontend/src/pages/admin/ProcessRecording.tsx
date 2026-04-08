import AdminSidebar from '../../components/AdminSidebar';

export default function ProcessRecording() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-6">
          <p>Admin Process Recording Works</p>
        </div>
      </div>
    </div>
  );
}
