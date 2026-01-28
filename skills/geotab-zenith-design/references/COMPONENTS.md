# Zenith Component Reference

Detailed API reference for Zenith components.

## Buttons

### Variants

```jsx
import { Button } from '@geotab/zenith';

// Primary - main actions
<Button variant="primary" onClick={handleSave}>Save Changes</Button>

// Secondary - alternative actions
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>

// Danger - destructive actions
<Button variant="danger" onClick={handleDelete}>Delete</Button>

// Ghost - minimal visual weight
<Button variant="ghost" onClick={handleToggle}>Toggle</Button>
```

### States

```jsx
// Disabled
<Button variant="primary" disabled>Processing...</Button>

// Loading (if supported)
<Button variant="primary" loading>Saving...</Button>

// With icon
<Button variant="primary" icon="save">Save</Button>
<Button variant="primary" icon="refresh" iconPosition="right">Refresh</Button>

// Icon only (requires aria-label)
<Button variant="ghost" icon="close" aria-label="Close dialog" />
```

### Sizes

```jsx
<Button variant="primary" size="small">Small</Button>
<Button variant="primary" size="medium">Medium</Button>  // default
<Button variant="primary" size="large">Large</Button>
```

## Text Fields

### Basic Usage

```jsx
import { TextField } from '@geotab/zenith';

<TextField
  label="Vehicle Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

### Props

```jsx
<TextField
  label="Email Address"        // Required label
  value={email}                // Controlled value
  onChange={handleChange}      // Change handler
  placeholder="user@example.com"
  required                     // Shows required indicator
  disabled                     // Disables input
  readOnly                     // Read-only state
  error="Invalid email"        // Error message
  helperText="We'll never share your email"
  maxLength={100}
  type="email"                 // text, email, password, number, tel, url
/>
```

### Multiline (Textarea)

```jsx
<TextField
  label="Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  multiline
  rows={4}
  maxLength={500}
/>
```

## Select/Dropdown

### Basic Usage

```jsx
import { Select } from '@geotab/zenith';

<Select
  label="Vehicle Group"
  value={selected}
  onChange={(value) => setSelected(value)}
  options={[
    { value: 'all', label: 'All Vehicles' },
    { value: 'trucks', label: 'Trucks' },
    { value: 'vans', label: 'Vans' }
  ]}
/>
```

### With Placeholder

```jsx
<Select
  label="Status"
  value={status}
  onChange={setStatus}
  placeholder="Select a status..."
  options={statusOptions}
/>
```

### Disabled Options

```jsx
<Select
  label="Region"
  value={region}
  onChange={setRegion}
  options={[
    { value: 'na', label: 'North America' },
    { value: 'eu', label: 'Europe' },
    { value: 'ap', label: 'Asia Pacific', disabled: true }
  ]}
/>
```

### Multi-Select

```jsx
<Select
  label="Tags"
  value={selectedTags}
  onChange={setSelectedTags}
  options={tagOptions}
  multiple
/>
```

## Tables

### Basic Table

```jsx
import { Table } from '@geotab/zenith';

const columns = [
  { key: 'name', header: 'Vehicle Name' },
  { key: 'status', header: 'Status' },
  { key: 'driver', header: 'Driver' }
];

const data = [
  { id: 1, name: 'Truck 001', status: 'Active', driver: 'John' },
  { id: 2, name: 'Van 002', status: 'Idle', driver: 'Jane' }
];

<Table columns={columns} data={data} />
```

### Sortable Columns

```jsx
const columns = [
  { key: 'name', header: 'Vehicle', sortable: true },
  { key: 'lastTrip', header: 'Last Trip', sortable: true },
  { key: 'status', header: 'Status' }  // not sortable
];

<Table
  columns={columns}
  data={data}
  onSort={(key, direction) => {
    // direction: 'asc' | 'desc' | null
    handleSort(key, direction);
  }}
/>
```

### Row Selection

```jsx
<Table
  columns={columns}
  data={data}
  selectable
  selectedRows={selectedIds}
  onSelectionChange={(ids) => setSelectedIds(ids)}
/>
```

### Row Click Handler

```jsx
<Table
  columns={columns}
  data={data}
  onRowClick={(row) => {
    setSelectedVehicle(row);
    openDetailPanel();
  }}
/>
```

### Custom Cell Rendering

```jsx
const columns = [
  { key: 'name', header: 'Vehicle' },
  {
    key: 'status',
    header: 'Status',
    render: (value, row) => (
      <Badge variant={value === 'Active' ? 'success' : 'neutral'}>
        {value}
      </Badge>
    )
  },
  {
    key: 'actions',
    header: '',
    render: (_, row) => (
      <Button variant="ghost" size="small" onClick={() => handleEdit(row)}>
        Edit
      </Button>
    )
  }
];
```

## Checkboxes

### Basic Checkbox

```jsx
import { Checkbox } from '@geotab/zenith';

<Checkbox
  label="Enable notifications"
  checked={notificationsEnabled}
  onChange={(checked) => setNotificationsEnabled(checked)}
/>
```

### Indeterminate State

```jsx
// For "select all" patterns
<Checkbox
  label="Select all"
  checked={allSelected}
  indeterminate={someSelected && !allSelected}
  onChange={handleSelectAll}
/>
```

### Disabled

```jsx
<Checkbox
  label="Premium feature"
  checked={false}
  disabled
  helperText="Upgrade to enable"
/>
```

## Radio Buttons

```jsx
import { RadioGroup, Radio } from '@geotab/zenith';

<RadioGroup
  label="Report frequency"
  value={frequency}
  onChange={setFrequency}
>
  <Radio value="daily" label="Daily" />
  <Radio value="weekly" label="Weekly" />
  <Radio value="monthly" label="Monthly" />
</RadioGroup>
```

## Modal/Dialog

### Basic Modal

```jsx
import { Modal, Button } from '@geotab/zenith';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Delete"
>
  <p>Are you sure you want to delete this vehicle?</p>
  <p>This action cannot be undone.</p>

  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  </div>
</Modal>
```

### Modal Sizes

```jsx
<Modal size="small" ...>   // ~400px
<Modal size="medium" ...>  // ~600px (default)
<Modal size="large" ...>   // ~800px
```

### Preventing Close on Overlay Click

```jsx
<Modal
  isOpen={showModal}
  onClose={handleClose}
  closeOnOverlayClick={false}  // Only close via X button or Cancel
>
```

## Alerts/Banners

### Alert Variants

```jsx
import { Alert } from '@geotab/zenith';

<Alert variant="success">Operation completed successfully.</Alert>
<Alert variant="warning">Your session will expire in 5 minutes.</Alert>
<Alert variant="error">Failed to save changes. Please try again.</Alert>
<Alert variant="info">New features are available in this update.</Alert>
```

### Dismissible Alerts

```jsx
<Alert
  variant="info"
  dismissible
  onDismiss={() => setShowAlert(false)}
>
  You have 3 pending approvals.
</Alert>
```

### Alert with Action

```jsx
<Alert variant="warning">
  Your subscription expires soon.
  <Button variant="ghost" size="small" onClick={handleRenew}>
    Renew now
  </Button>
</Alert>
```

## Loading States

### Spinner

```jsx
import { Spinner } from '@geotab/zenith';

<Spinner size="small" />   // 16px
<Spinner size="medium" />  // 24px (default)
<Spinner size="large" />   // 48px

// Centered loading state
<div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
  <Spinner size="large" />
</div>
```

### Skeleton Loading

```jsx
import { Skeleton } from '@geotab/zenith';

// Text skeleton
<Skeleton width="60%" height="20px" />

// Card skeleton
<Skeleton width="100%" height="120px" borderRadius="8px" />

// Table row skeleton
<Skeleton width="100%" height="48px" count={5} />
```

## Badges/Tags

```jsx
import { Badge } from '@geotab/zenith';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Offline</Badge>
<Badge variant="neutral">Draft</Badge>
<Badge variant="info">New</Badge>
```

## Tooltips

```jsx
import { Tooltip } from '@geotab/zenith';

<Tooltip content="Click to save your changes">
  <Button variant="primary">Save</Button>
</Tooltip>

// With placement
<Tooltip content="More options" placement="bottom">
  <Button variant="ghost" icon="more" />
</Tooltip>
```

## Icons

```jsx
import { Icon } from '@geotab/zenith';

<Icon name="vehicle" />
<Icon name="driver" />
<Icon name="route" />
<Icon name="alert" />
<Icon name="settings" />
<Icon name="search" />
<Icon name="close" />
<Icon name="check" />

// With size
<Icon name="vehicle" size={24} />
```

## Form Patterns

### Complete Form Example

```jsx
function VehicleForm({ vehicle, onSave, onCancel }) {
  const [name, setName] = useState(vehicle?.name || '');
  const [group, setGroup] = useState(vehicle?.group || '');
  const [active, setActive] = useState(vehicle?.active ?? true);
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!group) newErrors.group = 'Please select a group';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) {
      onSave({ name, group, active });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Vehicle Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        required
      />

      <Select
        label="Vehicle Group"
        value={group}
        onChange={setGroup}
        options={groupOptions}
        error={errors.group}
        required
      />

      <Checkbox
        label="Active"
        checked={active}
        onChange={setActive}
      />

      <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
}
```
