
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DateRangeSelector = ({ 
  dateRange, 
  onDateRangeChange, 
  selectedDate, 
  onDateChange 
}: DateRangeSelectorProps) => {
  const today = new Date();
  
  const disabledDays = (date: Date) => {
    return isFuture(date);
  };

  return (
    <div className="flex items-center space-x-4">
      <Select value={dateRange} onValueChange={onDateRangeChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="custom">Custom Date</SelectItem>
        </SelectContent>
      </Select>

      {dateRange === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              disabled={disabledDays}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default DateRangeSelector;
