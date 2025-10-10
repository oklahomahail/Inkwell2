// IconShowcase - Demo component showing InkwellFeather usage patterns
// This component can be used for testing and documentation purposes

import InkwellFeather, { INKWELL_ICONS, type InkwellIconName } from './InkwellFeather';

const SHOWCASE_SECTIONS = [
  {
    title: 'Navigation & Core Icons',
    icons: [
      'home',
      'settings',
      'analytics',
      'timeline',
      'writing',
      'planning',
    ] as InkwellIconName[],
  },
  {
    title: 'Writing & Content Icons',
    icons: ['edit', 'document', 'save', 'copy', 'delete', 'add'] as InkwellIconName[],
  },
  {
    title: 'UI & State Icons',
    icons: ['check', 'close', 'search', 'menu', 'show', 'hide'] as InkwellIconName[],
  },
];

const SIZE_DEMO = [
  { size: 'xs' as const, label: '12px (xs)' },
  { size: 'sm' as const, label: '16px (sm)' },
  { size: 'md' as const, label: '20px (md)' },
  { size: 'lg' as const, label: '24px (lg)' },
  { size: 'xl' as const, label: '32px (xl)' },
  { size: '2xl' as const, label: '48px (2xl)' },
];

const COLOR_DEMO = [
  { color: 'default' as const, label: 'Default' },
  { color: 'primary' as const, label: 'Primary' },
  { color: 'success' as const, label: 'Success' },
  { color: 'warning' as const, label: 'Warning' },
  { color: 'error' as const, label: 'Error' },
  { color: 'brand' as const, label: 'Brand' },
];

export default function IconShowcase() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          InkwellFeather Icon System
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Standardized, type-safe icons for the Inkwell writing platform
        </p>
      </div>

      {/* Icon Registry Showcase */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Available Icons ({Object.keys(INKWELL_ICONS).length} total)
        </h2>

        {SHOWCASE_SECTIONS.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
              {section.title}
            </h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-4">
              {section.icons.map((iconName) => (
                <div
                  key={iconName}
                  className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <InkwellFeather name={iconName} size="lg" color="default" className="mb-2" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {iconName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Size Variants */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Size Variants</h2>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-center gap-8">
            {SIZE_DEMO.map((item) => (
              <div key={item.size} className="flex flex-col items-center space-y-2">
                <InkwellFeather name="home" size={item.size} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Color Variants */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Color Variants
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-center gap-8">
            {COLOR_DEMO.map((item) => (
              <div key={item.color} className="flex flex-col items-center space-y-2">
                <InkwellFeather name="star" size="lg" color={item.color} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Usage Examples
        </h2>

        {/* Button Examples */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Button Integration
          </h3>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <InkwellFeather name="save" size="sm" />
              Save Draft
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <InkwellFeather name="analytics" size="sm" />
              View Analytics
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
              <InkwellFeather name="delete" size="sm" color="error" />
              Delete
            </button>
          </div>
        </div>

        {/* Navigation Examples */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Navigation Menu
          </h3>
          <nav className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-w-xs">
            {[
              { icon: 'home' as const, label: 'Dashboard', active: true },
              { icon: 'writing' as const, label: 'Writing', active: false },
              { icon: 'planning' as const, label: 'Planning', active: false },
              { icon: 'timeline' as const, label: 'Timeline', active: false },
              { icon: 'analytics' as const, label: 'Analytics', active: false },
              { icon: 'settings' as const, label: 'Settings', active: false },
            ].map((item) => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  item.active
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <InkwellFeather
                  name={item.icon}
                  size="sm"
                  color={item.active ? 'primary' : 'default'}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Interactive Examples */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Interactive Elements
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <InkwellFeather name="check" size="sm" color="success" />
              <span>Task completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <InkwellFeather name="alert" size="sm" color="warning" />
              <span>Review needed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <InkwellFeather name="info" size="sm" color="primary" />
              <span>Information available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Code Examples</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Basic usage:</p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
              {`<InkwellFeather name="home" />`}
            </code>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">With size and color:</p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
              {`<InkwellFeather name="writing" size="lg" color="primary" />`}
            </code>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">With custom styling:</p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
              {`<InkwellFeather name="star" className="hover:text-yellow-500 transition-colors" />`}
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
