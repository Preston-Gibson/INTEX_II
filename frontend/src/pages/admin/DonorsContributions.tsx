import AdminSidebar from '../../components/AdminSidebar';

export default function DonorsContributions() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden font-body">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-6">
          <p>Admin Donor Contributions Works</p>
        </div>
      </div>
    </div>
  );
}
