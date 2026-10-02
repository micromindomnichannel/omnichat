import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../../state/store';
import { VerticalProvider } from '../../state/verticalContext';
import { Toast } from '../../components/shared/Toast';
import { Products } from '../Products';
import { Services } from '../Services';

const mockProduct = {
  id: 'prod_1',
  name: 'Leather Weekend Bag',
  price: 1200,
  stock: 8,
  category: 'Bags',
  sku: 'BG-1200',
  image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
  variants: []
};

const mockService = {
  id: 'srv_1',
  name: 'Teeth Whitening Deluxe',
  price: 1500,
  duration: 60,
  category: 'Cosmetic',
  description: 'Full laser whitening session',
  image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500'
};

function renderProducts() {
  return render(
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <Products />
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

function renderServices() {
  return render(
    <MemoryRouter>
      <StoreProvider>
        <VerticalProvider>
          <Services />
          <Toast />
        </VerticalProvider>
      </StoreProvider>
    </MemoryRouter>
  );
}

describe('Products and Services modals & ImageUploader flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/bootstrap')) {
        return {
          ok: true,
          json: async () => ({
            products: [mockProduct],
            services: [mockService]
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it('opens product add modal, tests ImageUploader preset and remove photo, and submits new product', async () => {
    renderProducts();

    expect(await screen.findByText('Leather Weekend Bag')).toBeInTheDocument();

    const addProductBtn = screen.getByRole('button', { name: /add new product/i });
    fireEvent.click(addProductBtn);

    expect(screen.getByRole('heading', { name: 'Add New Inventory Product' })).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByPlaceholderText(/e\.g\. black leather bag/i);
    const priceInput = screen.getByPlaceholderText('850');
    const stockInput = screen.getByPlaceholderText('10');

    fireEvent.change(nameInput, { target: { value: 'Classic Silk Scarf' } });
    fireEvent.change(priceInput, { target: { value: '450' } });
    fireEvent.change(stockInput, { target: { value: '25' } });

    // Test ImageUploader preset selection
    const presetBtn = screen.getByRole('button', { name: 'Silk Dress' });
    fireEvent.click(presetBtn);

    // Remove photo
    const removePhotoBtn = screen.getByTitle('Remove photo');
    fireEvent.click(removePhotoBtn);

    // Re-select preset
    fireEvent.click(presetBtn);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /add to store inventory/i });
    fireEvent.submit(submitBtn.closest('form')!);

    expect(await screen.findByText(/added to inventory/i)).toBeInTheDocument();
  });

  it('guards ImageUploader against invalid file types with alert', async () => {
    const alertMock = vi.fn();
    window.alert = alertMock;

    renderProducts();

    expect(await screen.findByText('Leather Weekend Bag')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add new product/i }));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pdfFile = new File(['dummy'], 'contract.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', { value: [pdfFile], configurable: true });
    fireEvent.change(fileInput);

    expect(alertMock).toHaveBeenCalledWith('Please select an image file (PNG, JPG, WEBP).');
  });

  it('prefills product data on edit and updates product', async () => {
    renderProducts();

    expect(await screen.findByText('Leather Weekend Bag')).toBeInTheDocument();

    const row = screen.getByText('Leather Weekend Bag').closest('tr')!;
    const editBtn = within(row).getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: 'Edit Inventory Item' })).toBeInTheDocument();

    const nameInput = screen.getByDisplayValue('Leather Weekend Bag');
    fireEvent.change(nameInput, { target: { value: 'Luxury Weekend Bag' } });

    const saveBtn = screen.getByRole('button', { name: /save inventory changes/i });
    fireEvent.submit(saveBtn.closest('form')!);

    expect(await screen.findByText('Product "Luxury Weekend Bag" updated')).toBeInTheDocument();
  });

  it('handles product delete with window.confirm cancellation and confirmation', async () => {
    renderProducts();

    expect(await screen.findByText('Leather Weekend Bag')).toBeInTheDocument();

    const row = screen.getByText('Leather Weekend Bag').closest('tr')!;
    const buttons = row.querySelectorAll('button');
    const deleteBtn = buttons[buttons.length - 1]; // last button is delete

    // Case 1: Cancel delete
    window.confirm = vi.fn(() => false);
    fireEvent.click(deleteBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(screen.queryByText(/product .* deleted/i)).not.toBeInTheDocument();

    // Case 2: Confirm delete
    window.confirm = vi.fn(() => true);
    fireEvent.click(deleteBtn);
    expect(await screen.findByText(/product "leather weekend bag" deleted/i)).toBeInTheDocument();
  });

  it('manages service modal: add, edit prefill, and delete with window.confirm', async () => {
    renderServices();

    expect(await screen.findByText('Teeth Whitening Deluxe')).toBeInTheDocument();

    // Add Service Modal
    const addServiceBtn = screen.getByRole('button', { name: /add new service/i });
    fireEvent.click(addServiceBtn);

    expect(screen.getByText('Add Service & Pre-loaded Photo')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/dental cleaning/i), { target: { value: 'Full Facial Treatment' } });
    fireEvent.change(screen.getByPlaceholderText('600'), { target: { value: '800' } });
    fireEvent.change(screen.getByPlaceholderText('30'), { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clinic Dental' }));

    const submitBtn = screen.getByRole('button', { name: /add service & photo/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Service added with pre-loaded AI photo!')).toBeInTheDocument();

    // Edit Service Modal (click on service card)
    const cardTitle = await screen.findByText('Teeth Whitening Deluxe');
    fireEvent.click(cardTitle.closest('.card') || cardTitle);

    expect(screen.getByText('Edit Service')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Teeth Whitening Deluxe')).toBeInTheDocument();

    const saveChangesBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveChangesBtn);
    expect(await screen.findByText('Service "Teeth Whitening Deluxe" updated')).toBeInTheDocument();

    // Delete Service
    fireEvent.click(cardTitle.closest('.card') || cardTitle);
    window.confirm = vi.fn(() => true);
    const deleteBtn = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(await screen.findByText('Service "Teeth Whitening Deluxe" deleted')).toBeInTheDocument();
  });
});
