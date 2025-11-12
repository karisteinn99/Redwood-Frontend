import { Slot } from '@radix-ui/react-slot';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from 'utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', asChild = false, ...props }, ref) => {
    const { className, ...rest } = props;

    // Base styles that apply to all variants
    const baseStyles =
      'px-8 py-3 font-bold text-lg text-center flex items-center justify-center rounded-xl transition-all duration-300 shadow-lg cursor-pointer hover:cursor-pointer focus:outline-none hover:brightness-95 active:brightness-110';

    // Variant-specific styles
    const variantStyles = {
      primary: 'bg-primary text-white border-2 border-primary',
      outline:
        'bg-transparent text-primary border-2 border-primary hover:bg-primary/20 hover:text-primary',
    };

    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(baseStyles, variantStyles[variant], className)}
        ref={ref}
        {...rest}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
