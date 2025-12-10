import { Customer, InstallmentPlan, Payment, Transaction } from '../types';

const CUSTOMERS_KEY = 'app_customers';
const PLANS_KEY = 'app_plans';
const TRANSACTIONS_KEY = 'app_transactions';

export const getCustomers = (): Customer[] => {
  const data = localStorage.getItem(CUSTOMERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveCustomer = (customer: Customer) => {
  const customers = getCustomers();
  const existingIndex = customers.findIndex(c => c.id === customer.id);
  
  if (existingIndex >= 0) {
    customers[existingIndex] = customer;
  } else {
    customers.push(customer);
  }
  
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
};

export const getPlans = (): InstallmentPlan[] => {
  const data = localStorage.getItem(PLANS_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePlan = (plan: InstallmentPlan) => {
  const plans = getPlans();
  plans.unshift(plan); // Add to top
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
};

export const updatePlan = (updatedPlan: InstallmentPlan) => {
  const plans = getPlans();
  const index = plans.findIndex(p => p.id === updatedPlan.id);
  if (index !== -1) {
    plans[index] = updatedPlan;
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }
};

export const deletePlan = (planId: string) => {
  let plans = getPlans();
  plans = plans.filter(p => p.id !== planId);
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
};

// Transaction Methods
export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTransaction = (transaction: Transaction) => {
  const transactions = getTransactions();
  transactions.unshift(transaction); // Add to top
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const deleteTransaction = (id: string) => {
  let transactions = getTransactions();
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};