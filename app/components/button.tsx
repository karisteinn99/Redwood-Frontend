import { ButtonHTMLAttributes } from 'react';
import { cn } from 'utils/cn';

const Button = ({ ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { className, ...rest } = props;
  return (
    <button
      className={cn(
        'rounded-md border-[1.5px] border-blue-700 bg-white p-2 font-semibold hover:opacity-95 active:brightness-110'
      )}
      {...rest}
    ></button>
  );
};

export default Button;
