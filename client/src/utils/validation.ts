export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const validateName = (name: string): string => {
  if (!name.trim()) {
    return 'Name is required';
  }
  if (name.length < 3) {
    return 'Name must be at least 3 characters';
  }
  if (name.length > 255) {
    return 'Name must not exceed 255 characters';
  }
  return '';
};

export const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (email.length > 255) {
    return 'Email must not exceed 255 characters';
  }
  if (!emailRegex.test(email)) {
    return 'Invalid email address';
  }
  return '';
};

export const validatePassword = (password: string): string => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (password.length > 30) {
    return 'Password must not exceed 30 characters';
  }
  if (!passwordRegex.test(password)) {
    return 'Password must contain uppercase, lowercase and a number';
  }
  return '';
};

export const validateConfirmPassword = (confirm: string, passwordVal: string): string => {
  if (!confirm) {
    return 'Confirm password is required';
  }
  if (confirm !== passwordVal) {
    return 'Passwords do not match';
  }
  return '';
};

export const decimalRegex = /^\d{1,4}(\.\d)?$/;

export const validateAddTaskForm = (data: {
  title: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  estimatedHours: string;
  actualHours: string;
}) => {
  const errors: { title?: string; estimatedHours?: string; actualHours?: string } = {};

  if (!data.title.trim()) {
    errors.title = 'Task title is required.';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Task title must be at least 3 characters.';
  } else if (data.title.trim().length > 255) {
    errors.title = 'Task title cannot exceed 255 characters.';
  }

  if (data.estimatedHours) {
    const parsedEst = parseFloat(data.estimatedHours);
    if (isNaN(parsedEst) || parsedEst <= 0) {
      errors.estimatedHours = 'Estimated hours must be a positive number.';
    } else if (!decimalRegex.test(data.estimatedHours)) {
      errors.estimatedHours =
        'Estimated hours must be a valid decimal (max 9999.9, up to 1 decimal place).';
    }
  }

  if (data.status === 'done') {
    if (!data.actualHours) {
      errors.actualHours = 'Actual hours are required when status is done.';
    } else {
      const parsedAct = parseFloat(data.actualHours);
      if (isNaN(parsedAct) || parsedAct <= 0) {
        errors.actualHours = 'Actual hours must be a positive number.';
      } else if (!decimalRegex.test(data.actualHours)) {
        errors.actualHours =
          'Actual hours must be a valid decimal (max 9999.9, up to 1 decimal place).';
      }
    }
  }

  return errors;
};

export const budgetRegex = /^\d{1,8}(\.\d{1,2})?$/;

export const validateAddProjectForm = (data: {
  name: string;
  budget: string;
  startDate?: string;
  endDate?: string;
}) => {
  const errors: { name?: string; budget?: string; endDate?: string } = {};

  if (!data.name.trim()) {
    errors.name = 'Project name is required.';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Project name must be at least 3 characters.';
  } else if (data.name.trim().length > 255) {
    errors.name = 'Project name cannot exceed 255 characters.';
  }

  if (data.budget) {
    const parsedBudget = parseFloat(data.budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      errors.budget = 'Budget must be a positive number.';
    } else if (!budgetRegex.test(data.budget)) {
      errors.budget = 'Budget must be a valid number (max 8 digits, up to 2 decimal places).';
    }
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
      errors.endDate = 'End date cannot be earlier than start date.';
    }
  }

  return errors;
};
