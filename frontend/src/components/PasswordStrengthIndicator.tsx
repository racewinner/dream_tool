import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { PasswordValidationResult } from '../utils/passwordValidator';
import { validatePassword } from '../utils/passwordValidator';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const { errors } = validatePassword(password);
  const strength = errors.length === 0 ? 100 : 0;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Password Strength
      </Typography>
      <LinearProgress
        variant="determinate"
        value={strength}
        color={strength > 0 ? 'success' : 'error'}
        sx={{
          height: 10,
          borderRadius: 5,
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
          },
        }}
      />
      {errors.map((error: string, index: number) => (
        <Typography
          key={index}
          variant="caption"
          color="error"
          sx={{ mt: 1 }}
        >
          {error}
        </Typography>
      ))}
    </Box>
  );
};

export default PasswordStrengthIndicator;
