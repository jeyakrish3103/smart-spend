export default function CategoryPicker({ categories, value, onChange, loading }) {
  return (
    <select
      className="input"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      id="category-picker"
    >
      <option value="">
        {loading ? 'Loading...' : 'Select category'}
      </option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.icon} {cat.name}
        </option>
      ))}
    </select>
  );
}
