import React from 'react'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Control, Controller, Field, FieldValues, Path } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    placeholder?: string;
    label?: string;
   type?: 'text' | 'email' | 'password'| 'file';

}

const Formfield = ({ control,name,placeholder,label,type="text"}: FormFieldProps<T>) => (
    <Controller name={name} control={control} render={({ field }) => (
            <FormItem>
              <FormLabel className='label'>{label}</FormLabel>
              <FormControl>
                <Input className="input" placeholder={placeholder} 
                type={type}{...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
    )} />
);
export default Formfield