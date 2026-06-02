import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Table, TableBody, TableHeadCell, TableHeader } from './Table';
import { TableCell, TableRow } from './TableRow';

describe('<Table>', () => {
  it('aria-label ile tablo yapısını render eder', () => {
    render(
      <Table aria-label="Kullanıcı listesi">
        <TableHeader>
          <tr>
            <TableHeadCell>Sicil</TableHeadCell>
            <TableHeadCell>Ad</TableHeadCell>
          </tr>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell muted>12345678</TableCell>
            <TableCell>Ahmet</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('table', { name: 'Kullanıcı listesi' })).toBeDefined();
    expect(screen.getByText('12345678')).toBeDefined();
    expect(screen.getByText('Ahmet')).toBeDefined();
  });
});
