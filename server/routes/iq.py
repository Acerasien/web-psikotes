# server/routes/iq.py
"""
IQ Test routes - Phase-based test with 8 sequential phases
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from auth import get_current_user
from database import get_db
from models import User, Test, Assignment, Result, Question, Option, Response, Phase
from schemas import PhaseOut, PhaseSubmitRequest, PhaseSubmitResponse, IQSubmitAllResponse, IQSubmitAllRequest

router = APIRouter(tags=["iq"])


def _get_iq_test(db: Session) -> Test:
    """Find the IQ test by code."""
    test = db.query(Test).filter(Test.code == "IQ").first()
    if not test:
        raise HTTPException(status_code=404, detail="IQ test not found. Please run seed_iq.py first.")
    return test


def _get_assignment(db: Session, assignment_id: int, user: User) -> Assignment:
    """Get and validate an IQ assignment."""
    assignment = (
        db.query(Assignment)
        .options(joinedload(Assignment.test))
        .filter(Assignment.id == assignment_id)
        .first()
    )
    if not assignment or assignment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if assignment.test.code != "IQ":
        raise HTTPException(status_code=400, detail="This assignment is not an IQ test")
    return assignment


@router.get("/assignments/{assignment_id}/phases")
def get_phases(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all 8 phases for the IQ test assignment.
    Returns phase info with status (locked/current/done) and practice questions.
    """
    assignment = _get_assignment(db, assignment_id, current_user)
    test = assignment.test

    # Get all phases for this test
    phases = (
        db.query(Phase)
        .filter(Phase.test_id == test.id)
        .order_by(Phase.order_number)
        .all()
    )

    # Get question counts per phase
    phase_question_counts = {}
    for p in phases:
        count = db.query(Question).filter(Question.phase_id == p.id).count()
        phase_question_counts[p.id] = count

    # Determine which phases are done (check if responses exist per phase)
    done_phase_ids = set()
    if assignment.status == "in_progress" or assignment.status == "completed":
        # Get distinct phase_ids from responses for this assignment
        responses = (
            db.query(Question.phase_id)
            .join(Response, Response.question_id == Question.id)
            .filter(Response.assignment_id == assignment_id)
            .distinct()
            .all()
        )
        done_phase_ids = {r[0] for r in responses if r[0] is not None}

    # Find the first non-done phase (current)
    current_phase_order = None
    for p in phases:
        if p.id not in done_phase_ids:
            current_phase_order = p.order_number
            break

    result = []
    for p in phases:
        is_done = p.id in done_phase_ids
        is_locked = current_phase_order is not None and p.order_number > current_phase_order

        # Count answered questions for this phase
        answered = 0
        if is_done:
            answered = (
                db.query(Response)
                .join(Question, Response.question_id == Question.id)
                .filter(
                    Response.assignment_id == assignment_id,
                    Question.phase_id == p.id
                )
                .distinct(Response.question_id)
                .count()
            )

        # Apply phase timer override if available in class config
        timer_seconds = p.timer_seconds
        if current_user.class_config:
            time_overrides = current_user.class_config.config.get("time_overrides", {})
            iq_overrides = time_overrides.get("IQ", {})
            if isinstance(iq_overrides, dict) and "phases" in iq_overrides:
                phase_timers = iq_overrides["phases"]
                if len(phase_timers) >= p.order_number:
                    timer_seconds = phase_timers[p.order_number - 1]

        result.append({
            "id": p.id,
            "order_number": p.order_number,
            "timer_seconds": timer_seconds,
            "practice_questions": p.practice_questions if not is_done else None,
            "status": "done" if is_done else ("current" if p.order_number == current_phase_order else "locked"),
            "is_unlocked": not is_locked,
            "answered_count": answered if is_done else 0,
            "total_questions": phase_question_counts.get(p.id, 0),
        })

    return result


@router.get("/assignments/{assignment_id}/phase/{phase_id}/questions")
def get_phase_questions(
    assignment_id: int,
    phase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get questions for a specific phase.
    Returns questions with options for the given phase_id.
    """
    assignment = _get_assignment(db, assignment_id, current_user)

    phase = db.query(Phase).filter(
        Phase.id == phase_id,
        Phase.test_id == assignment.test_id
    ).first()
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    questions = (
        db.query(Question)
        .options(joinedload(Question.options))
        .filter(Question.phase_id == phase.id)
        .order_by(Question.order_index)
        .all()
    )

    output = []
    for q in questions:
        options_data = []
        for opt in q.options:
            options_data.append({
                "id": opt.id,
                "label": opt.label,
                "content": opt.content,
            })
        output.append({
            "id": q.id,
            "content": q.content,
            "order": q.order_index,
            "options": options_data,
            "meta_data": q.meta_data,
            "phase_id": q.phase_id,
        })

    # Apply phase timer override if available in class config
    timer_seconds = phase.timer_seconds
    if current_user.class_config:
        time_overrides = current_user.class_config.config.get("time_overrides", {})
        iq_overrides = time_overrides.get("IQ", {})
        if isinstance(iq_overrides, dict) and "phases" in iq_overrides:
            phase_timers = iq_overrides["phases"]
            if len(phase_timers) >= phase.order_number:
                timer_seconds = phase_timers[phase.order_number - 1]

    return {
        "phase_id": phase.id,
        "order_number": phase.order_number,
        "timer_seconds": timer_seconds,
        "questions": output,
    }


@router.post("/assignments/{assignment_id}/submit-phase", response_model=PhaseSubmitResponse)
def submit_phase(
    assignment_id: int,
    request: PhaseSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit answers for a single phase.
    Answers are saved to the database. Phase is marked as done.
    """
    assignment = _get_assignment(db, assignment_id, current_user)

    if assignment.status != "in_progress":
        raise HTTPException(status_code=400, detail="Test is not in progress")

    # Validate phase exists and belongs to this test
    phase = (
        db.query(Phase)
        .filter(Phase.id == request.phase_id, Phase.test_id == assignment.test_id)
        .first()
    )
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    # Check if already submitted
    existing = (
        db.query(Response)
        .join(Question, Response.question_id == Question.id)
        .filter(
            Response.assignment_id == assignment_id,
            Question.phase_id == phase.id
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="This phase has already been submitted")

    # Get all questions for this phase with options
    questions = (
        db.query(Question)
        .options(joinedload(Question.options))
        .filter(Question.phase_id == phase.id)
        .order_by(Question.order_index)
        .all()
    )
    question_map = {q.id: q for q in questions}

    # Save responses
    if not request.answers:
        # If no answers (e.g. time ran out), add a marker response for the first question
        # This ensures the phase is marked as 'done' in get_phases
        first_q = questions[0] if questions else None
        if first_q:
            marker_resp = Response(
                user_id=current_user.id,
                test_id=assignment.test_id,
                assignment_id=assignment_id,
                question_id=first_q.id,
                selected_option_id=None,
                selection_type="single",
            )
            db.add(marker_resp)
    
    correct_count = 0
    for ans in request.answers:
        q_id = ans["question_id"]
        if q_id not in question_map:
            continue

        q = question_map[q_id]
        is_multi = q.meta_data.get("multi_select", False) if q.meta_data else False

        if is_multi:
            # Multi-select: store option_ids as comma-separated string
            option_ids = ans.get("option_ids", [])
            for opt_id in option_ids:
                resp = Response(
                    user_id=current_user.id,
                    test_id=assignment.test_id,
                    assignment_id=assignment_id,
                    question_id=q_id,
                    selected_option_id=opt_id,
                    selection_type="multi",
                )
                db.add(resp)

            # Check correctness
            correct_ids = [opt.id for opt in q.options if opt.scoring_logic.get("correct")]
            if set(option_ids) == set(correct_ids):
                correct_count += 1
        else:
            # Single answer
            opt_id = ans.get("option_id")
            resp = Response(
                user_id=current_user.id,
                test_id=assignment.test_id,
                assignment_id=assignment_id,
                question_id=q_id,
                selected_option_id=opt_id,
                selection_type="single",
            )
            db.add(resp)

            # Check correctness
            for opt in q.options:
                if opt.id == opt_id and opt.scoring_logic.get("correct"):
                    correct_count += 1
                    break

    db.commit()

    return PhaseSubmitResponse(
        phase_id=phase.id,
        answered_count=len(request.answers),
        correct_count=correct_count,
    )


@router.post("/assignments/{assignment_id}/submit-all", response_model=IQSubmitAllResponse)
def submit_all(
    assignment_id: int,
    submission: IQSubmitAllRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit all phases, compute final score, create Result.
    Validates all 8 phases are complete before scoring.
    """
    assignment = _get_assignment(db, assignment_id, current_user)

    if assignment.status != "in_progress":
        raise HTTPException(status_code=400, detail="Test is not in progress")

    # Check for existing result (prevent duplicate)
    existing_result = db.query(Result).filter(
        Result.assignment_id == assignment_id,
        Result.user_id == current_user.id
    ).first()
    if existing_result:
        raise HTTPException(status_code=400, detail="This test has already been submitted")

    # Get all phases
    phases = (
        db.query(Phase)
        .filter(Phase.test_id == assignment.test_id)
        .order_by(Phase.order_number)
        .all()
    )

    # Verify all phases have been 'attempted' (have at least one response row)
    for p in phases:
        response_exists = (
            db.query(Response)
            .join(Question, Response.question_id == Question.id)
            .filter(
                Response.assignment_id == assignment_id,
                Question.phase_id == p.id
            )
            .first()
        )
        if not response_exists:
            raise HTTPException(
                status_code=400,
                detail=f"Fase {p.order_number} belum diselesaikan. Harap selesaikan semua fase sebelum mengirim."
            )

    # Get all questions with options and phase info
    questions = (
        db.query(Question)
        .options(joinedload(Question.options), joinedload(Question.phase))
        .join(Phase, Question.phase_id == Phase.id)
        .filter(Phase.test_id == assignment.test_id)
        .all()
    )

    # Get all responses for this assignment
    responses = (
        db.query(Response)
        .filter(Response.assignment_id == assignment_id)
        .all()
    )

    # Build answers list for scoring
    # Group by question_id to handle multi-select
    question_answers = {}
    for r in responses:
        q_id = r.question_id
        if q_id not in question_answers:
            question_answers[q_id] = {"question_id": q_id, "option_ids": [], "option_id": r.selected_option_id}
        question_answers[q_id]["option_ids"].append(r.selected_option_id)

    answers_list = list(question_answers.values())

    # Score
    from scoring.iq import score_iq
    scoring_result = score_iq(answers_list, questions)

    # Create Result
    result = Result(
        user_id=current_user.id,
        test_id=assignment.test_id,
        assignment_id=assignment_id,
        score=scoring_result["raw_score"],
        time_taken=0,  # Phase-based, not tracked globally
        completed_at=datetime.utcnow(),
        details={
            "device": submission.device_info or "Unknown",
            "raw_score": scoring_result["raw_score"],
            "scaled_score": scoring_result["scaled_score"],
            "max_score": scoring_result["max_score"],
            "iq": scoring_result["iq"],
            "classification": scoring_result["classification"],
            "section_scores": scoring_result["section_scores"],
            "phase_scores": scoring_result["phase_scores"],
            "is_complete": True,
            "answered_count": scoring_result["raw_score"],
            "total_questions": scoring_result["max_score"],
        },
    )
    db.add(result)

    # Update assignment status
    assignment.status = "completed"

    db.commit()

    return IQSubmitAllResponse(
        message="IQ test submitted successfully",
        score=scoring_result["raw_score"],
        max_score=scoring_result["max_score"],
        scaled_score=scoring_result["scaled_score"],
        iq=scoring_result["iq"],
        classification=scoring_result["classification"],
        section_scores=scoring_result["section_scores"],
        phase_scores=scoring_result["phase_scores"],
    )
