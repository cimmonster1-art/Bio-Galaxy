import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('derives a contained error state', () => {
    const error = new Error('scene failed');
    assert.deepEqual(ErrorBoundary.getDerivedStateFromError(error), { error });
  });
  it('renders children before failure and fallback after failure', () => {
    const child = React.createElement('p', null, 'scene');
    const boundary = new ErrorBoundary({ children: child, fallback: (error) => error.message });
    assert.equal(boundary.render(), child);
    boundary.state = { error: new Error('contained') };
    assert.equal(boundary.render(), 'contained');
  });
});
