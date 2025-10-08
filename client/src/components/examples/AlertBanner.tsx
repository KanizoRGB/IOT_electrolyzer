import AlertBanner from '../AlertBanner';

export default function AlertBannerExample() {
  return (
    <div className="space-y-4 p-6">
      <AlertBanner
        type="warning"
        title="Temperature Rising"
        message="System temperature has exceeded normal operating range. Monitor closely."
        action={{
          label: "View Details",
          onClick: () => console.log('View temperature details')
        }}
      />
      <AlertBanner
        type="error"
        title="Pressure Fault"
        message="Critical pressure threshold exceeded. Immediate attention required."
        action={{
          label: "Emergency Stop",
          onClick: () => console.log('Emergency stop triggered')
        }}
      />
      <AlertBanner
        type="info"
        title="Maintenance Scheduled"
        message="Routine maintenance window begins in 2 hours. System will be unavailable."
        dismissible={false}
      />
    </div>
  );
}