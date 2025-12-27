import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

type ButtonProps = {
  title: string;
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(({ title, ...touchableProps }, ref) => {
  return (
    <TouchableOpacity
      ref={ref}
      {...touchableProps}
      className={`${styles.button} ${touchableProps.className}`}>
      
    </TouchableOpacity>
  );
});

Button.displayName = 'Button';

const styles = {
  button: 'rounded-xl p-4',
  //buttonText: 'text-slate-950 text-lg font-semibold text-center',
};
