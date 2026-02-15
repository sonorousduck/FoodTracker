import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateWeightDto } from './createweight.dto';

describe('CreateWeightDto', () => {
  it('accepts an ISO date string', () => {
    const dto = plainToInstance(CreateWeightDto, {
      weightEntry: 170.5,
      date: '2025-04-01T00:00:00.000Z',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.date).toBeInstanceOf(Date);
    expect(Number.isNaN(dto.date.getTime())).toBe(false);
  });

  it('rejects an invalid date', () => {
    const dto = plainToInstance(CreateWeightDto, {
      weightEntry: 170.5,
      date: 'not-a-date',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.property).toBe('date');
  });
});
