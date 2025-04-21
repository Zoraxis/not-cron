export const RadioButton = ({ label, name, value, className = "" }) => {
  const isChecked = localStorage.getItem(`r${name}${label}`) == "1";
  const buttonClasses = `
      bg-secondary py-2.5 w-full flex justify-center rounded-md cursor-pointer
      ${className} 
      ${isChecked ? "!bg-primary" : ""}
    `.trim();

  const handleClick = () =>
    localStorage.setItem(`r${name}${label}`, isChecked ? "0" : "1");

  return (
    <div id class={buttonClasses}>
      <span class="text-primary-text leading-llg text-md font-semibold">
        {label}
      </span>
    </div>
  );
};
