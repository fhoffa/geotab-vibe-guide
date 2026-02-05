# Styling Add-Ins with Zenith

## What is Zenith?

Zenith is Geotab's official React component library providing:

- Pre-built React components (buttons, inputs, tables, modals)
- Design tokens (colors, spacing, typography)
- WCAG 2.2 accessibility compliance
- Consistent styling matching MyGeotab

Zenith pages increase development speed by over 40%.

## When to Use This Reference

- Upgrading a working vanilla JS Add-In to professional styling
- Building React-based MyGeotab Add-Ins
- When you need the exact MyGeotab look and feel

**Note:** Start with [ADDINS.md](ADDINS.md) first to build a working Add-In, then use this reference to upgrade its styling.

## Installation

```bash
npm install @geotab/zenith
```

**Always import the CSS:**
```javascript
import '@geotab/zenith/dist/index.css';
```

## Component Hierarchy

Zenith organizes components into four levels:

| Level | Description | Examples |
|-------|-------------|----------|
| **Electrons** | Foundation tokens | Spacing, colors, typography |
| **Atoms** | Basic elements | Button, TextInput, Checkbox |
| **Organisms** | Complex components | Table, Modal, Toolbar |
| **Templates** | Page layouts | Dashboard, List view |

## Core Components

### Buttons

```jsx
import { Button } from '@geotab/zenith';

<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
<Button variant="primary" disabled>Processing...</Button>
```

### Text Fields

```jsx
import { TextInput } from '@geotab/zenith';

<TextInput
  label="Vehicle Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Enter name..."
  required
  error="Validation error message"
/>
```

### Select/Dropdown

```jsx
import { Select } from '@geotab/zenith';

<Select
  label="Vehicle Group"
  value={selected}
  onChange={setSelected}
  options={[
    { value: 'all', label: 'All Vehicles' },
    { value: 'trucks', label: 'Trucks' }
  ]}
/>
```

### Tables

```jsx
import { Table } from '@geotab/zenith';

const columns = [
  { key: 'name', header: 'Vehicle', sortable: true },
  { key: 'status', header: 'Status' }
];

<Table
  columns={columns}
  data={vehicles}
  onRowClick={(row) => handleSelect(row)}
/>
```

### Modals

```jsx
import { Modal, Button } from '@geotab/zenith';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Action"
>
  <p>Are you sure?</p>
  <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
</Modal>
```

### Alerts

```jsx
import { Alert } from '@geotab/zenith';

<Alert variant="success">Saved successfully.</Alert>
<Alert variant="warning">Pending maintenance.</Alert>
<Alert variant="error">Failed to load data.</Alert>
<Alert variant="info">New features available.</Alert>
```

### Loading States

```jsx
import { Waiting } from '@geotab/zenith';

{loading ? <Waiting size="medium" /> : <Content />}
```

## Design Tokens

### Colors

```css
/* Primary */
--zenith-primary: #0078D4;
--zenith-primary-dark: #005A9E;

/* Semantic */
--zenith-success: #107C10;
--zenith-warning: #FFB900;
--zenith-error: #D13438;

/* Neutral */
--zenith-neutral-900: #201F1E;
--zenith-neutral-100: #EDEBE9;
```

### Spacing

```css
--zenith-spacing-xs: 4px;
--zenith-spacing-sm: 8px;
--zenith-spacing-md: 16px;
--zenith-spacing-lg: 24px;
--zenith-spacing-xl: 32px;
```

### Typography

```css
--zenith-font-family: 'Segoe UI', -apple-system, sans-serif;
--zenith-font-size-md: 14px;
--zenith-font-size-lg: 16px;
--zenith-font-size-xxl: 28px;
```

## Basic Page Layout

```jsx
import React, { useState } from 'react';
import { Button, TextInput, Table, Waiting, Alert } from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';

function Dashboard({ api }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.call('Get', { typeName: 'Device' });
      setData(result);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'serialNumber', header: 'Serial' }
  ];

  const filtered = data.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>
        Fleet Dashboard
      </h1>

      {error && <Alert variant="error">{error}</Alert>}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <TextInput
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="primary" onClick={loadData}>Refresh</Button>
      </div>

      {loading ? (
        <Waiting size="large" />
      ) : (
        <Table columns={columns} data={filtered} />
      )}
    </div>
  );
}
```

## Accessibility Guidelines

Zenith components are WCAG 2.2 compliant. Follow these practices:

### Always Provide Labels
```jsx
<TextInput label="Email Address" />  // Good
<Button aria-label="Close" icon="close" />  // Good for icon-only
```

### Keyboard Navigation
- Tab navigates between elements
- Enter/Space activates controls
- Escape closes modals/dropdowns
- Arrow keys navigate menus

### Focus Management
```jsx
const triggerRef = useRef();

<Modal onClose={() => {
  setShowModal(false);
  triggerRef.current?.focus();  // Return focus
}}>
```

## Common Mistakes

### Missing CSS Import
```jsx
// WRONG - no styles
import { Button } from '@geotab/zenith';

// CORRECT
import { Button } from '@geotab/zenith';
import '@geotab/zenith/dist/index.css';
```

### Overriding Styles
```jsx
// WRONG - fighting the design system
<Button style={{ backgroundColor: 'purple' }}>Custom</Button>

// CORRECT - use variants
<Button variant="primary">Standard</Button>
```

### Missing Loading States
```jsx
// WRONG - no feedback
{data.map(item => <Row item={item} />)}

// CORRECT
{loading ? <Waiting /> : data.map(item => <Row item={item} />)}
```

### Missing FeedbackProvider for Alerts
```jsx
// WRONG - Alert won't work properly
function App() {
  return <Alert variant="error">Error!</Alert>;
}

// CORRECT - wrap with FeedbackProvider
import { FeedbackProvider, Alert } from '@geotab/zenith';

function App() {
  return (
    <FeedbackProvider>
      <Alert variant="error">Error!</Alert>
    </FeedbackProvider>
  );
}
```

### Table with Custom Render Functions
The Zenith `Table` component may have issues with complex custom render functions. If you encounter errors, use a standard HTML table with Zenith styling:

```jsx
// If Zenith Table causes issues, use HTML table with Zenith colors
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr>
      <th style={{ padding: '12px', borderBottom: '1px solid #EDEBE9', color: '#605E5C' }}>
        Name
      </th>
    </tr>
  </thead>
  <tbody>
    {data.map(item => (
      <tr key={item.id}>
        <td style={{ padding: '12px', borderBottom: '1px solid #EDEBE9' }}>
          {item.name}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## Trade-offs vs Vanilla JS

| Aspect | Vanilla JS | React + Zenith |
|--------|-----------|----------------|
| Setup | Instant | npm + webpack build |
| Bundle size | ~5 KB | ~2.3 MB |
| Debugging | Clear errors | Minified stack traces |
| Iteration | Edit -> Refresh | Edit -> Build -> Refresh |
| MyGeotab match | Approximate | Exact |

**Use Zenith when:** Professional look matching MyGeotab is required

**Use Vanilla JS when:** Quick prototypes, learning, simple add-ins

## Using with MyGeotab Add-Ins

For React Add-Ins using Zenith:

1. Bundle React and Zenith into your Add-In
2. Include CSS in build output
3. Use ES5-compatible output for browser support

**Note:** Embedded Add-Ins (vanilla JS) cannot use Zenith components directly. Instead, reference Zenith's design tokens for colors/spacing and mimic the visual style with CSS.

See [ADDINS.md](ADDINS.md) for vanilla JavaScript patterns.

## Resources

- [Official Documentation](https://developers.geotab.com/zenith/introduction/)
- [Storybook Components](https://developers.geotab.com/zenith-storybook/)
- [NPM Package](https://www.npmjs.com/package/@geotab/zenith)
- Contact: zenith@geotab.com

For detailed component API reference, see [ZENITH_COMPONENTS.md](ZENITH_COMPONENTS.md).
For a complete example application, see [ZENITH_EXAMPLE.md](ZENITH_EXAMPLE.md).
