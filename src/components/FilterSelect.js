import Select from 'react-select';

const FilterSelect = ({ options, value, onChange, placeholder, getOptionLabel }) => {
  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      getOptionLabel={getOptionLabel}
      getOptionValue={(opt) => opt.id}
      placeholder={placeholder}
      isClearable
      styles={{
        container: (base) => ({ ...base, width: 250 }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};

export default FilterSelect;
