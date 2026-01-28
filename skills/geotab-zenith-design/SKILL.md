---
name: geotab-zenith-design
description: Build UIs for Geotab applications using the Zenith design system and React component library. Use when creating MyGeotab Add-Ins, custom dashboards, or any Geotab-branded frontend that needs consistent styling and accessible components.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Geotab Zenith Design System

## What is Zenith?

Zenith is Geotab's official React component library providing:

- Pre-built React components (buttons, inputs, tables, modals)
- Design tokens (colors, spacing, typography)
- WCAG 2.2 accessibility compliance
- Consistent styling matching MyGeotab

Zenith pages increase development speed by over 40%.

## When to Use This Skill

- Building React-based MyGeotab Add-Ins
- Creating fleet management dashboards
- When you need accessible, consistent Geotab-branded UI

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
| **Atoms** | Basic elements | Button, TextField, Checkbox |
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
import { TextField } from '@geotab/zenith';

<TextField
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
import { Spinner } from '@geotab/zenith';

{loading ? <Spinner size="medium" /> : <Content />}
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
import { Button, TextField, Table, Spinner, Alert } from '@geotab/zenith';
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
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="primary" onClick={loadData}>Refresh</Button>
      </div>

      {loading ? (
        <Spinner size="large" />
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
<TextField label="Email Address" />  // Good
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
{loading ? <Spinner /> : data.map(item => <Row item={item} />)}
```

## Using with MyGeotab Add-Ins

For React Add-Ins using Zenith:

1. Bundle React and Zenith into your Add-In
2. Include CSS in build output
3. Use ES5-compatible output for browser support

**Note:** Embedded Add-Ins (vanilla JS) cannot use Zenith components directly. Instead, reference Zenith's design tokens for colors/spacing and mimic the visual style with CSS.

See the `geotab-addins` skill for vanilla JavaScript patterns.

## Resources

- [Official Documentation](https://developers.geotab.com/zenith/introduction/)
- [Storybook Components](https://developers.geotab.com/zenith-storybook/)
- [NPM Package](https://www.npmjs.com/package/@geotab/zenith)
- Contact: zenith@geotab.com

For detailed component API reference, see [references/COMPONENTS.md](references/COMPONENTS.md).
For a complete example application, see [references/EXAMPLE.md](references/EXAMPLE.md).
