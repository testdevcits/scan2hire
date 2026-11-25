import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SalaryDetails from './SalaryDetails';
const mockPost = jest.fn();
jest.mock('../../contexts/ApiContext', () => ({ useApi: () => ({ API: { post: mockPost } }) }));
beforeEach(() => mockPost.mockReset());
test('salary is masked until password verification succeeds and can be hidden again', async () => {
  mockPost.mockResolvedValue({ data: { data: { salary: '5000', salaryOnHold: false } } });
  render(<SalaryDetails />);
  expect(screen.getAllByText('****')).toHaveLength(2);
  expect(screen.queryByText('5000')).toBeNull(); expect(mockPost).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'View' }));
  fireEvent.change(screen.getByLabelText('Login password'), { target: { value: 'correct' } });
  fireEvent.click(screen.getByRole('button', { name: 'Verify & View' }));
  await waitFor(() => expect(screen.getByText('5000')).toBeTruthy());
  expect(mockPost).toHaveBeenCalledWith('/employees/me/salary/reveal', { password: 'correct' });
  fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
  expect(screen.queryByText('5000')).toBeNull(); expect(screen.getAllByText('****')).toHaveLength(2);
});
test('incorrect password keeps salary masked and shows an error', async () => {
  mockPost.mockRejectedValue({ response: { data: { message: 'Incorrect password' } } });
  render(<SalaryDetails />); fireEvent.click(screen.getByRole('button', { name: 'View' }));
  fireEvent.change(screen.getByLabelText('Login password'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Verify & View' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Incorrect password'));
  expect(screen.getAllByText('****')).toHaveLength(2); expect(screen.getByLabelText('Login password').value).toBe('');
});
