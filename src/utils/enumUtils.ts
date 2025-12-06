export const formatEnumValue = (value: string): string => {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

export const enumToText = (value: string): string => {
  return formatEnumValue(value);
};
  
  export const getEnumOptions = (enumObject: Record<string, string>) => {
    return Object.values(enumObject).map(value => ({
      value,
      label: formatEnumValue(value)
    }));
  };