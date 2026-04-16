// ==========================================
// EDU METRICS: ONLINE EXAMINATION SYSTEM
// ==========================================

// ------------------------------------------
// STEP 2: BASE CLASSES IMPLEMENTATION
// ------------------------------------------

/**
 * Question (Base/Abstract Class)
 * Demonstrates Abstraction & Encapsulation.
 */
class Question {
    #id;
    
    constructor(text, marks) {
        // Enforce abstraction: Cannot instantiate Base Class directly.
        if (new.target === Question) {
            throw new TypeError("Cannot construct Abstract instances directly.");
        }
        this.#id = Question.generateId();
        this.text = text;
        this.marks = marks;
    }

    // Static method: Automatic ID Generation
    static generateId() {
        if (!this.lastId) this.lastId = 0;
        this.lastId++;
        return `Q-${this.lastId.toString().padStart(4, '0')}`;
    }

    // Getter for private property
    getId() {
        return this.#id;
    }

    // Abstract method to enforce polymorphism in subclasses
    evaluate(answer) {
        throw new Error("Method 'evaluate()' must be implemented by subclasses.");
    }
}

// ------------------------------------------
// STEP 3: SUBCLASSES (POLYMORPHISM / INHERITANCE)
// ------------------------------------------

/**
 * Multiple Choice Question
 */
class MCQQuestion extends Question {
    #options;
    #correctIndex;

    constructor(text, marks, options, correctIndex) {
        super(text, marks);
        if (!Array.isArray(options) || options.length < 2) {
            throw new Error("MCQ must provide an array of at least two options.");
        }
        this.#options = options;
        this.#correctIndex = correctIndex;
    }

    getOptions() {
        return [...this.#options];
    }

    // Override abstract method
    evaluate(answer) {
        return parseInt(answer) === this.#correctIndex;
    }
}

/**
 * True / False Question
 */
class TrueFalseQuestion extends Question {
    #correctAnswer;

    constructor(text, marks, correctAnswer) {
        super(text, marks);
        if (typeof correctAnswer !== "boolean") {
            throw new TypeError("correctAnswer must be a boolean value.");
        }
        this.#correctAnswer = correctAnswer;
    }

    // Override abstract method
    evaluate(answer) {
        const parsedAnswer = typeof answer === 'string' ? answer.toLowerCase() === 'true' : Boolean(answer);
        return parsedAnswer === this.#correctAnswer;
    }
}

/**
 * Descriptive Question
 */
class DescriptiveQuestion extends Question {
    #expectedKeywords;

    constructor(text, marks, expectedKeywords = []) {
        super(text, marks);
        this.maxLength = 1000;
        this.#expectedKeywords = expectedKeywords.map(k => k.toLowerCase());
    }

    // Override abstract method
    evaluate(answerText) {
        if (typeof answerText !== 'string' || answerText.trim() === "") return false;
        
        // Custom Subjective Logic checking:
        if (this.#expectedKeywords.length === 0) return true; // Give marks just for making an attempt
        
        const lowerAnswer = answerText.toLowerCase();
        // Give marks if they hit any of the required conceptual keywords
        return this.#expectedKeywords.some(keyword => lowerAnswer.includes(keyword));
    }
}


/**
 * Student Class
 * Demonstrates strict Encapsulation.
 */
class Student {
    #studentId;
    #attempts;

    constructor(name, course) {
        this.#studentId = Student.generateStudentId();
        this.name = name;
        this.course = course;
        this.#attempts = []; // Stores exam attempt history securely
    }

    // Static method: Automatic Student ID
    static generateStudentId() {
        if (!this.lastId) this.lastId = 0;
        this.lastId++;
        return `STU-${this.lastId.toString().padStart(4, '0')}`;
    }

    getStudentId() {
        return this.#studentId;
    }
    
    addAttempt(attemptData) {
        this.#attempts.push(attemptData);
    }
    
    getAttempts() {
        // Return a shallow copy to prevent external mutation of the array
        return [...this.#attempts];
    }
}


/**
 * Exam Class
 * Demonstrates Encapsulation & Composition.
 */
class Exam {
    #examId;
    #questionList;

    constructor(courseName, totalMarks, timeDuration, passingMarks) {
        this.#examId = Exam.generateExamId();
        this.courseName = courseName;
        this.totalMarks = totalMarks;
        this.timeDuration = timeDuration; // in minutes
        this.passingMarks = passingMarks;
        this.#questionList = []; // Composition of Question objects
    }

    // Static method: Automatic Exam ID
    static generateExamId() {
        if (!this.lastId) this.lastId = 0;
        this.lastId++;
        return `EXM-${this.lastId.toString().padStart(4, '0')}`;
    }

    getExamId() {
        return this.#examId;
    }

    // Safe composition
    addQuestion(question) {
        if (!(question instanceof Question)) {
            throw new TypeError("Only instances inheriting from Question can be added.");
        }
        this.#questionList.push(question);
    }

    getQuestions() {
        // Return a reference copy to secure internal array layout
        return [...this.#questionList];
    }
}

// ------------------------------------------
// STEP 4: DATA STRUCTURES (STACK & QUEUE)
// ------------------------------------------

/**
 * Stack Data Structure (LIFO)
 * Used to track student answers during an active exam to allow safe "Undo" operations.
 */
class Stack {
    #items;

    constructor() {
        this.#items = [];
    }

    push(element) {
        this.#items.push(element);
    }

    pop() {
        if (this.isEmpty()) return null;
        return this.#items.pop();
    }

    peek() {
        if (this.isEmpty()) return null;
        return this.#items[this.#items.length - 1];
    }

    isEmpty() {
        return this.#items.length === 0;
    }

    size() {
        return this.#items.length;
    }

    clear() {
        this.#items = [];
    }

    // Safely export stack contents as array for final scoring
    exportArray() {
        return [...this.#items];
    }
}

/**
 * Queue Data Structure (FIFO)
 * Used centrally by the system manager to process exam submissions asynchronously.
 */
class Queue {
    #items;

    constructor() {
        this.#items = [];
    }

    enqueue(element) {
        this.#items.push(element);
    }

    dequeue() {
        if (this.isEmpty()) return null;
        return this.#items.shift();
    }

    front() {
        if (this.isEmpty()) return null;
        return this.#items[0];
    }

    isEmpty() {
        return this.#items.length === 0;
    }

    size() {
        return this.#items.length;
    }
}

// ------------------------------------------
// STEP 5: EXAM ATTEMPT LOGIC
// ------------------------------------------

/**
 * ExamAttempt
 * Runs a secure, localized runtime session for a student taking an exam.
 * Protects the global Exam template from runtime mutations.
 */
class ExamAttempt {
    #answerStack;
    #startTime;
    #endTime;
    #scheduledTimerId;

    constructor(studentId, exam) {
        this.studentId = studentId;
        // Lock the runtime template
        this.examReference = exam; 
        this.examId = exam.getExamId();
        
        this.timeDuration = exam.timeDuration; // in minutes
        
        this.#answerStack = new Stack();
        this.attemptStatus = "Pending";
        this.#startTime = new Date();
        this.#endTime = null;

        // EDGE CASE: Handle Time expiration dynamically
        this.#scheduledTimerId = setTimeout(() => {
            if (this.attemptStatus === "Pending") {
                console.warn(`Time expired for Student ${this.studentId}! Auto-submitting.`);
                this.attemptStatus = "Timeout";
                this.submit(true); // Pass true to indicate forced submission
            }
        }, this.timeDuration * 60 * 1000); 
    }

    // Handles user inserting their answer
    answerQuestion(questionId, answerValue) {
        if (this.attemptStatus !== "Pending") {
            console.error("Cannot answer: Exam is already closed.");
            return;
        }

        // Push state to Stack for potential undo
        this.#answerStack.push({
            questionId: questionId,
            answer: answerValue
        });
    }

    // Leverages Stack LIFO functionality strictly
    undoLastAnswer() {
        if (this.attemptStatus !== "Pending") return null;
        
        const popped = this.#answerStack.pop();
        return popped; // The UI can read this to revert radio button / text selections visually
    }

    // Concludes the test and freezes mutations
    submit(isForced = false) {
        if (this.attemptStatus === "Completed") return null;

        // Invalidate ghost timer if manually submitted early
        clearTimeout(this.#scheduledTimerId);
        this.#endTime = new Date();
        
        if (!isForced) {
            this.attemptStatus = "Completed";
        }
        
        // Securely export raw history for Step 6 grading 
        const finalAnswersList = this.#answerStack.exportArray();
        
        return {
            studentId: this.studentId,
            examId: this.examId,
            submittedAnswers: finalAnswersList,
            submissionTime: this.#endTime,
            attemptStatus: this.attemptStatus,
            examReference: this.examReference
        };
    }
}

// ------------------------------------------
// STEP 6: EVALUATION AND RESULT GENERATION
// ------------------------------------------

/**
 * Result (Immutable Data Object)
 * Represents the final processed output of an exam attempt.
 */
class Result {
    constructor(studentId, examId, scoreObtained, totalMarks, submissionTime, isPass, attemptStatus) {
        this.studentId = studentId;
        this.examId = examId;
        this.scoreObtained = scoreObtained;
        this.totalMarks = totalMarks;
        this.submissionTime = submissionTime;
        
        // Pass/Fail Criteria mapping
        this.status = isPass ? "Pass" : "Fail";
        
        // Edge Case Handling: Indicate if they failed purely because they ran out of time
        if (attemptStatus === "Timeout" && !isPass) {
            this.status = "Failed (Timeout)";
        }
    }

    printReport() {
        return `
========================================
📋 PERFORMANCE SUMMARY
========================================
Student ID:   ${this.studentId}
Exam ID:      ${this.examId}
Submitted:    ${this.submissionTime.toLocaleString()}
----------------------------------------
FINAL SCORE:  ${this.scoreObtained} / ${this.totalMarks}
STATUS:       ${this.status.toUpperCase()}
========================================
        `;
    }
}

/**
 * ResultGenerator
 * A static utility engine that traverses the payload safely.
 */
class ResultGenerator {
    static evaluateAttempt(attemptData) {
        // Extract references
        const exam = attemptData.examReference; 
        const submittedAnswers = attemptData.submittedAnswers; // Raw Stack Array 
        
        let scoreObtained = 0;
        const examQuestions = exam.getQuestions();
        
        // Convert the stack history into a final mapped intent 
        // (Just in case they re-answered the same question ID multiple times without popping)
        const finalAnswersMap = new Map();
        submittedAnswers.forEach(attemptRecord => {
            finalAnswersMap.set(attemptRecord.questionId, attemptRecord.answer);
        });

        // 🎇 CORE POLYMORPHISM IN ACTION 🎇
        examQuestions.forEach(q => {
            const studentGivenAnswer = finalAnswersMap.get(q.getId());
            if (studentGivenAnswer !== undefined && studentGivenAnswer !== null) {
                // The grading engine DOES NOT know what kind of question 'q' is!
                // It dynamically triggers the specific evaluate() override for MCQ/Descriptive/etc.
                const isCorrect = q.evaluate(studentGivenAnswer); 
                
                if (isCorrect) {
                    scoreObtained += q.marks;
                }
            }
        });

        // Determine if they met the dynamic passing criteria threshold
        const isPass = scoreObtained >= exam.passingMarks;
        
        return new Result(
            attemptData.studentId,
            exam.getExamId(),
            scoreObtained,
            exam.totalMarks,
            attemptData.submissionTime,
            isPass,
            attemptData.attemptStatus
        );
    }
}

// ------------------------------------------
// STEP 7: EXAM MANAGER & MANUAL SORTING
// ------------------------------------------

/**
 * ExamManager
 * Central controller binding the whole system together and performing
 * advanced unassisted sorting on outcome data structures.
 */
class ExamManager {
    #students;
    #exams;
    #results;

    constructor() {
        this.#students = [];
        this.#exams = [];
        this.#results = [];
    }

    registerStudent(student) {
        this.#students.push(student);
    }

    createExam(exam) {
        this.#exams.push(exam);
    }

    getPublishedExams() {
        return [...this.#exams];
    }

    recordResult(resultObj) {
        if (!(resultObj instanceof Result)) {
            throw new TypeError("System only accepts validated Result instances.");
        }
        this.#results.push(resultObj);
    }

    /**
     * MANUAL SORT ALGORITHM: SELECTION SORT
     */
    generateMeritList() {
        const sortedList = [...this.#results];
        const n = sortedList.length;

        for (let i = 0; i < n - 1; i++) {
            let highestPriorityIndex = i;
            
            for (let j = i + 1; j < n; j++) {
                const current = sortedList[j];
                const highestSoFar = sortedList[highestPriorityIndex];

                if (current.scoreObtained > highestSoFar.scoreObtained) {
                    highestPriorityIndex = j;
                } else if (current.scoreObtained === highestSoFar.scoreObtained) {
                    if (current.submissionTime.getTime() < highestSoFar.submissionTime.getTime()) {
                        highestPriorityIndex = j;
                    }
                }
            }

            if (highestPriorityIndex !== i) {
                const temp = sortedList[i];
                sortedList[i] = sortedList[highestPriorityIndex];
                sortedList[highestPriorityIndex] = temp;
            }
        }

        return sortedList;
    }

    getTopPerformers(topN = 3) {
        const sortedData = this.generateMeritList();
        const topArray = [];
        const limit = Math.min(topN, sortedData.length);
        for(let i = 0; i < limit; i++) topArray.push(sortedData[i]);
        return topArray;
    }
    
    getLowScorers() {
        const sortedData = this.generateMeritList();
        const bottomArray = [];
        for (let i = sortedData.length - 1; i >= 0; i--) {
            if (sortedData[i].status.includes("Fail")) bottomArray.push(sortedData[i]);
        }
        return bottomArray;
    }
}

// ------------------------------------------
// STEP 8: INTERACTIVE UI WIRING (ADMIN & STUDENT)
// ------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const manager = new ExamManager();
    const submissionQueue = new Queue();

    // DOM Nodes
    const btnAdminView = document.getElementById("btn-admin-view");
    const btnStudentView = document.getElementById("btn-student-view");
    
    // Major Sections
    const adminLoginSection = document.getElementById("admin-login-section");
    const adminSection = document.getElementById("admin-section");
    const loginSection = document.getElementById("login-section");
    const examSection = document.getElementById("exam-section");
    const resultSection = document.getElementById("result-section");

    let isAdminAuthenticated = false;

    // -- ROLE TOGGLING --
    btnAdminView.addEventListener("click", () => switchView("admin"));
    btnStudentView.addEventListener("click", () => switchView("student"));

    function switchView(mode) {
        // Strip out active sessions
        examSection.style.display = "none";
        resultSection.style.display = "none";
        
        if (mode === "admin") {
            btnAdminView.classList.add("active");
            btnStudentView.classList.remove("active");
            loginSection.style.display = "none";
            
            // Check state gate
            if (isAdminAuthenticated) {
                adminLoginSection.style.display = "none";
                adminSection.style.display = "block";
            } else {
                adminLoginSection.style.display = "block";
                adminSection.style.display = "none";
            }
            
        } else {
            btnStudentView.classList.add("active");
            btnAdminView.classList.remove("active");
            adminSection.style.display = "none";
            adminLoginSection.style.display = "none";
            loginSection.style.display = "block";
            
            const exams = manager.getPublishedExams();
            if (exams.length === 0) {
               alert("WARNING: The Admin has not deployed any exams yet! You cannot start the system.");
            }
        }
    }

    // -- ADMIN AUTHENTICATION LOGIC --
    document.getElementById("admin-login-btn").addEventListener("click", () => {
        const email = document.getElementById("admin-email").value.trim();
        const pwd = document.getElementById("admin-password").value;
        const errNode = document.getElementById("pwd-error");

        // Advanced Regex constraints mapping
        // Logic: Length >= 8 | 1 Lowercase | 1 Uppercase | 1 Numeral | 1 Special Char
        const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        errNode.style.display = "none";
        
        if (!pwdRegex.test(pwd)) {
            errNode.innerText = "Error: Password must be min 8 chars long, contain at least 1 uppercase letter, 1 number, and 1 symbol.";
            errNode.style.display = "block";
            return;
        }

        // Hardcoded identity check
        if (email.toLowerCase() === "adhirajjaysingh@gmail.com" && pwd === "@Adhiraj0206") {
            // Authentication Granted
            isAdminAuthenticated = true;
            adminLoginSection.style.display = "none";
            adminSection.style.display = "block";
        } else {
            alert("Security Alert: Invalid email or password combination. Access denied.");
        }
    });

    // -- ADMIN: CREATE EXAM CONFIG --
    let draftExam = null;
    let questionsAdded = 0;

    document.getElementById("admin-create-btn").addEventListener("click", () => {
        const cName = document.getElementById("admin-course-name").value.trim() || "Untitled Course";
        const tMarks = parseInt(document.getElementById("admin-total-marks").value) || 100;
        const tLimit = parseInt(document.getElementById("admin-time-limit").value) || 30;
        const pMarks = parseInt(document.getElementById("admin-passing-marks").value) || 40;

        // Instantiate live logic object
        draftExam = new Exam(cName, tMarks, tLimit, pMarks);
        
        document.getElementById("admin-step-1").style.display = "none";
        document.getElementById("admin-step-2").style.display = "block";
    });

    // -- ADMIN: QUESTION BUILDER DYNAMICS --
    const qTypeSelect = document.getElementById("q-type-select");
    const variantPanels = document.querySelectorAll(".variant-panel");

    qTypeSelect.addEventListener("change", (e) => {
        variantPanels.forEach(p => p.style.display = "none");
        document.getElementById(`variant-${e.target.value}`).style.display = "block";
    });

    document.getElementById("admin-add-q-btn").addEventListener("click", () => {
        const type = qTypeSelect.value;
        const text = document.getElementById("q-text").value.trim();
        const marks = parseInt(document.getElementById("q-marks").value) || 10;

        if (!text) {
             alert("Question text cannot be empty.");
             return;
        }

        try {
            // Polymorphism Dynamic Instantiation 
            if (type === "mcq") {
                const options = Array.from(document.querySelectorAll(".mcq-input")).map(i => i.value.trim() || "Empty Option");
                const correct = parseInt(document.querySelector('input[name="mcq-correct"]:checked').value);
                draftExam.addQuestion(new MCQQuestion(text, marks, options, correct));
            
            } else if (type === "tf") {
                const correctVal = document.getElementById("tf-correct-val").value === "true";
                draftExam.addQuestion(new TrueFalseQuestion(text, marks, correctVal));
            
            } else if (type === "desc") {
                const keywords = document.getElementById("desc-keywords").value.split(",").map(k => k.trim()).filter(k => k.length > 0);
                draftExam.addQuestion(new DescriptiveQuestion(text, marks, keywords));
            }
            
            questionsAdded++;
            document.getElementById("q-count").innerText = questionsAdded;
            
            // Reset basic forms for next
            document.getElementById("q-text").value = "";
            document.getElementById("q-marks").value = "";
            alert("Question securely encapsulated and assigned to exam template!");
        } catch (err) {
            alert(`Error adding question: ${err.message}`);
        }
    });

    // -- ADMIN: DEPLOY EXAM --
    document.getElementById("admin-deploy-btn").addEventListener("click", () => {
        if (questionsAdded === 0) {
            alert("You must map at least 1 question before publishing.");
            return;
        }
        manager.createExam(draftExam); // Locks it into global logic
        
        document.getElementById("admin-step-1").style.display = "block";
        document.getElementById("admin-step-2").style.display = "none";
        
        switchView("student"); // Bring tester immediately to the portal
    });


    // -- STUDENT: RUNTIME PORTAL --
    const nameInput = document.getElementById("student-name");
    
    let activeAttempt = null;
    let currentQIndex = 0;
    let liveQuestionsList = [];

    document.getElementById("start-btn").addEventListener("click", () => {
        const availableExams = manager.getPublishedExams();
        if (availableExams.length === 0) {
            alert("System Offline: Waiting for Admin to deploy an exam.");
            return;
        }

        const name = nameInput.value.trim() || "Unknown Candidate";
        const student = new Student(name, "GenEd");
        manager.registerStudent(student);

        // Fetch dynamically built exam
        const targetExam = availableExams[availableExams.length - 1]; 
        liveQuestionsList = targetExam.getQuestions();

        // Encapsulate attempt
        activeAttempt = new ExamAttempt(student.getStudentId(), targetExam);
        currentQIndex = 0;
        
        loginSection.style.display = "none";
        examSection.style.display = "block";
        
        document.getElementById("student-greeting").innerText = `Candidate: ${student.name} (${student.getStudentId()})`;
        document.getElementById("exam-title").innerText = targetExam.courseName;
        document.getElementById("undo-btn").style.display = "block";
        
        renderQuestion();
    });

    function renderQuestion() {
        if (currentQIndex >= liveQuestionsList.length) return;
        
        const q = liveQuestionsList[currentQIndex];
        document.getElementById("question-text").innerText = `Q${currentQIndex + 1}: ${q.text} (Value: ${q.marks} Marks)`;
        
        const optsContainer = document.getElementById("options-container");
        optsContainer.innerHTML = "";

        if (q instanceof MCQQuestion) {
            q.getOptions().forEach((o, i) => {
                optsContainer.insertAdjacentHTML("beforeend", `<div><input type="radio" name="ans" value="${i}" id="o${i}"><label for="o${i}">${o}</label></div>`);
            });
        } else if (q instanceof TrueFalseQuestion) {
            optsContainer.insertAdjacentHTML("beforeend", `<div><input type="radio" name="ans" value="true" id="ot"><label for="ot">True</label></div>`);
            optsContainer.insertAdjacentHTML("beforeend", `<div><input type="radio" name="ans" value="false" id="of"><label for="of">False</label></div>`);
        } else if (q instanceof DescriptiveQuestion) {
            optsContainer.insertAdjacentHTML("beforeend", `<textarea id="desc-ans" rows="4" placeholder="Type your answer..."></textarea>`);
        }
        
        document.getElementById("submit-btn").innerText = (currentQIndex === liveQuestionsList.length - 1) ? "Finalize Submission" : "Save & Next";
    }

    document.getElementById("submit-btn").addEventListener("click", () => {
        if (!activeAttempt || activeAttempt.attemptStatus !== "Pending") return;

        const currentQ = liveQuestionsList[currentQIndex];
        let givenValue = null;

        if (currentQ instanceof DescriptiveQuestion) {
            const txt = document.getElementById("desc-ans");
            if (txt) givenValue = txt.value;
        } else {
            const checked = document.querySelector('input[name="ans"]:checked');
            if (checked) givenValue = checked.value;
        }

        if (givenValue === null || givenValue.toString().trim() === "") {
            alert("Please provide an answer before navigating.");
            return;
        }

        activeAttempt.answerQuestion(currentQ.getId(), givenValue);
        currentQIndex++;

        if (currentQIndex >= liveQuestionsList.length) {
            finalizeExam();
        } else {
            renderQuestion();
        }
    });

    document.getElementById("undo-btn").addEventListener("click", () => {
        if (!activeAttempt || currentQIndex === 0) return;
        const undone = activeAttempt.undoLastAnswer();
        if (undone) {
            currentQIndex--;
            renderQuestion();
        }
    });
    
    // Auto timer global listener detecting edge case mutation
    setInterval(() => {
        if (activeAttempt && activeAttempt.attemptStatus === "Timeout" && examSection.style.display !== "none") {
            finalizeExam(true);
            alert("TIME EXPIRED! The system forcibly submitted your answer history.");
        }
    }, 1000);

    function finalizeExam(wasForced = false) {
        examSection.style.display = "none";
        resultSection.style.display = "block";
        
        const attemptPayload = activeAttempt.submit(wasForced);
        submissionQueue.enqueue(attemptPayload);
        
        const payloadToProcess = submissionQueue.dequeue();
        const systemResult = ResultGenerator.evaluateAttempt(payloadToProcess);
        
        manager.recordResult(systemResult);
        
        console.log(systemResult.printReport());

        document.getElementById("score-display").innerHTML = `
            Score: ${systemResult.scoreObtained} / ${systemResult.totalMarks} <br>
            <span style="font-size: 0.8em; color: ${systemResult.status.includes("Pass") ? "var(--accent)" : "#ef4444"};">
                Status: ${systemResult.status}
            </span>
        `;
    }
    
    document.getElementById("merit-list-btn")?.addEventListener("click", () => {
        console.log("=== MERIT LIST (SELECTION SORT RANKING) ===");
        console.table(manager.generateMeritList());
        alert("Check browser console log (F12) to see generated data mappings!");
    });
});


