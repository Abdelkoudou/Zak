# Contributing to MCQ Study App

Thank you for your interest in contributing to the MCQ Study App! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

---

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the project
- Show empathy towards other contributors

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

---

## Getting Started

### Prerequisites
- Git installed and configured
- Python 3.8+ for backend
- Node.js 16+ for mobile app
- Basic knowledge of FastAPI and React Native

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcq-study-app.git
   cd mcq-study-app
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/mcq-study-app.git
   ```

4. **Setup backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp env_example.txt .env
   # Edit .env with your settings
   alembic upgrade head
   python scripts/create_owner.py
   ```

5. **Setup mobile app**
   ```bash
   cd react-native-med-app
   npm install
   ```

6. **Verify setup**
   ```bash
   # Backend
   cd backend
   python run.py
   # Visit http://localhost:8000/docs

   # Mobile app
   cd react-native-med-app
   npm start
   ```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention
- `feature/` - New features (e.g., `feature/saved-questions`)
- `fix/` - Bug fixes (e.g., `fix/login-error`)
- `docs/` - Documentation (e.g., `docs/api-spec`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-service`)
- `test/` - Adding tests (e.g., `test/question-endpoints`)

### 2. Make Your Changes

```bash
# Make changes to code
# Test your changes
# Commit your changes (see Commit Guidelines below)
```

### 3. Keep Your Branch Updated

```bash
# Fetch latest changes
git fetch upstream

# Rebase your branch
git rebase upstream/main
```

### 4. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill in the PR template
5. Submit for review

---

## Coding Standards

### Backend (Python)

#### Style Guide
- Follow [PEP 8](https://pep8.org/)
- Use 4 spaces for indentation
- Maximum line length: 100 characters
- Use type hints

#### Example
```python
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/", response_model=List[schemas.Question])
def get_questions(
    skip: int = 0,
    limit: int = 100,
    module: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
) -> List[models.Question]:
    """
    Get questions with optional filtering.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        module: Filter by module name
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of questions
    """
    questions = crud.get_questions(db, skip=skip, limit=limit, module=module)
    return questions
```

#### Naming Conventions
- Functions: `snake_case` (e.g., `get_user_by_id`)
- Classes: `PascalCase` (e.g., `UserCreate`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_DEVICES`)
- Private methods: `_snake_case` (e.g., `_validate_token`)

#### Documentation
- Add docstrings to all functions
- Use Google-style docstrings
- Document parameters and return values

---

### Mobile App (TypeScript)

#### Style Guide
- Use TypeScript strict mode
- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Use functional components

#### Example
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../components/ui/Button';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answerId: number) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onAnswer 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswerSelect = (answerId: number) => {
    setSelectedAnswer(answerId);
    onAnswer(answerId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question_text}</Text>
      {question.answers.map((answer) => (
        <Button
          key={answer.id}
          onPress={() => handleAnswerSelect(answer.id)}
          variant={selectedAnswer === answer.id ? 'primary' : 'outline'}
        >
          {answer.answer_text}
        </Button>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
});
```

#### Naming Conventions
- Components: `PascalCase` (e.g., `QuestionCard`)
- Functions: `camelCase` (e.g., `handleAnswerSelect`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- Interfaces: `PascalCase` with `Props` suffix (e.g., `QuestionCardProps`)

#### Component Structure
```typescript
// 1. Imports
import React from 'react';
import { View } from 'react-native';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // 4. State
  const [state, setState] = useState();

  // 5. Effects
  useEffect(() => {
    // ...
  }, []);

  // 6. Handlers
  const handleAction = () => {
    // ...
  };

  // 7. Render
  return (
    <View>
      {/* ... */}
    </View>
  );
};

// 8. Styles
const styles = StyleSheet.create({
  // ...
});
```

---

## Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

**Good commits**:
```
feat(questions): add saved questions feature

- Add saved_questions table
- Create save/unsave endpoints
- Add UI for saving questions

Closes #123
```

```
fix(auth): resolve token expiration issue

Token was not being refreshed properly, causing
users to be logged out unexpectedly.

Fixes #456
```

```
docs(api): update API specification

Add documentation for new saved questions endpoints
```

**Bad commits**:
```
update stuff
```

```
fix bug
```

```
WIP
```

### Commit Best Practices
- Write clear, descriptive commit messages
- Keep commits focused (one logical change per commit)
- Reference issue numbers when applicable
- Use present tense ("add feature" not "added feature")
- Capitalize first letter of subject
- Don't end subject with a period

---

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**
   ```bash
   # Backend
   pytest

   # Mobile app
   npm test
   ```

3. **Check code style**
   ```bash
   # Backend
   flake8 app/

   # Mobile app
   npm run lint
   ```

4. **Update documentation**
   - Update README if needed
   - Update API docs if endpoints changed
   - Add comments to complex code

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Tested on iOS
- [ ] Tested on Android

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass
```

### Review Process

1. **Automated checks**
   - Code style (linting)
   - Tests (if configured)
   - Build success

2. **Code review**
   - At least one approval required
   - Address all comments
   - Make requested changes

3. **Merge**
   - Squash and merge (preferred)
   - Delete branch after merge

---

## Testing

### Backend Testing

#### Unit Tests
```python
# tests/test_questions.py
import pytest
from app import crud, schemas

def test_create_question(db_session):
    question_data = schemas.QuestionCreate(
        year=2024,
        study_year=2,
        module="Anatomie",
        # ...
    )
    question = crud.create_question(db_session, question_data)
    assert question.id is not None
    assert question.module == "Anatomie"
```

#### Run Tests
```bash
cd backend
pytest
pytest -v  # Verbose
pytest tests/test_questions.py  # Specific file
```

### Mobile App Testing

#### Component Tests
```typescript
// __tests__/QuestionCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuestionCard } from '../src/components/QuestionCard';

describe('QuestionCard', () => {
  it('renders question text', () => {
    const question = {
      id: 1,
      question_text: 'Test question?',
      answers: [],
    };
    
    const { getByText } = render(
      <QuestionCard question={question} onAnswer={() => {}} />
    );
    
    expect(getByText('Test question?')).toBeTruthy();
  });
});
```

#### Run Tests
```bash
cd react-native-med-app
npm test
npm test -- --coverage  # With coverage
```

---

## Documentation

### Code Documentation

**Backend**:
```python
def get_questions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    module: Optional[str] = None
) -> List[models.Question]:
    """
    Retrieve questions from database with optional filtering.
    
    Args:
        db: Database session
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        module: Optional module name filter
        
    Returns:
        List of Question objects
        
    Raises:
        ValueError: If limit is negative
    """
    if limit < 0:
        raise ValueError("Limit must be non-negative")
    
    query = db.query(models.Question)
    if module:
        query = query.filter(models.Question.module == module)
    return query.offset(skip).limit(limit).all()
```

**Mobile App**:
```typescript
/**
 * Fetches questions from the API with optional filters
 * 
 * @param filters - Optional filters for questions
 * @param filters.module - Filter by module name
 * @param filters.year - Filter by exam year
 * @returns Promise resolving to array of questions
 * @throws {Error} If API request fails
 */
export const getQuestions = async (
  filters?: QuestionFilters
): Promise<Question[]> => {
  try {
    const response = await api.get('/questions/', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch questions');
  }
};
```

---

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues
3. Ask in discussions
4. Create a new issue with "question" label

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to MCQ Study App! 🎉
