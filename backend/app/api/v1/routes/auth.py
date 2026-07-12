from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..core import db, security
from ..schemas import Token, UserCreate, UserResponse
from ..services import auth as auth_service

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db_session: Session = Depends(db.get_db)):
    return auth_service.create_user(db_session, user)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db_session: Session = Depends(db.get_db)):
    user = auth_service.get_user_by_email(db_session, form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
