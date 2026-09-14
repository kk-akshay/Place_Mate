import asyncio

from sqlalchemy import select

from app.db.session import (
    AsyncSessionLocal,
)
from app.models.aptitude import (
    AptitudeQuestion,
)

QUESTIONS = [
    {
        "category": "quantitative",
        "topic": "Percentages",
        "difficulty": "easy",
        "question_text": (
            "An article priced at ₹800 is increased by 15%. "
            "What is the new price?"
        ),
        "options": [
            "₹880",
            "₹900",
            "₹920",
            "₹940",
        ],
        "correct_option": 2,
        "explanation": (
            "15% of 800 is 120. "
            "800 + 120 = 920."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Ratio",
        "difficulty": "easy",
        "question_text": (
            "The ratio of boys to girls in a class is 3:5. "
            "If there are 64 students, how many are boys?"
        ),
        "options": [
            "20",
            "24",
            "32",
            "40",
        ],
        "correct_option": 1,
        "explanation": (
            "There are 8 total ratio parts. "
            "64 ÷ 8 = 8, so boys = 3 × 8 = 24."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Simple Interest",
        "difficulty": "easy",
        "question_text": (
            "Find the simple interest on ₹5,000 at 8% per annum "
            "for 2 years."
        ),
        "options": [
            "₹600",
            "₹700",
            "₹800",
            "₹900",
        ],
        "correct_option": 2,
        "explanation": (
            "SI = P × R × T / 100 = "
            "5000 × 8 × 2 / 100 = 800."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Average",
        "difficulty": "easy",
        "question_text": (
            "What is the average of 12, 15, 18, 21 and 24?"
        ),
        "options": [
            "16",
            "17",
            "18",
            "19",
        ],
        "correct_option": 2,
        "explanation": (
            "The sum is 90. "
            "90 ÷ 5 = 18."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Speed",
        "difficulty": "easy",
        "question_text": (
            "A car travels at 60 km/h for 2.5 hours. "
            "How far does it travel?"
        ),
        "options": [
            "120 km",
            "135 km",
            "150 km",
            "180 km",
        ],
        "correct_option": 2,
        "explanation": (
            "Distance = speed × time = 60 × 2.5 = 150 km."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Profit and Loss",
        "difficulty": "medium",
        "question_text": (
            "An item costs ₹1,200 and is sold for ₹1,380. "
            "What is the profit percentage?"
        ),
        "options": [
            "10%",
            "12%",
            "15%",
            "18%",
        ],
        "correct_option": 2,
        "explanation": (
            "Profit = 180. "
            "Profit percentage = 180 ÷ 1200 × 100 = 15%."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Time and Work",
        "difficulty": "medium",
        "question_text": (
            "A can finish a job in 12 days and B in 18 days. "
            "Approximately how many days will they take together?"
        ),
        "options": [
            "6 days",
            "7.2 days",
            "9 days",
            "10 days",
        ],
        "correct_option": 1,
        "explanation": (
            "Combined rate = 1/12 + 1/18 = 5/36. "
            "Time = 36/5 = 7.2 days."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Percentages",
        "difficulty": "medium",
        "question_text": (
            "25% of a number is 45. What is the number?"
        ),
        "options": [
            "160",
            "170",
            "180",
            "200",
        ],
        "correct_option": 2,
        "explanation": (
            "The number is 45 ÷ 0.25 = 180."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Compound Interest",
        "difficulty": "hard",
        "question_text": (
            "What is the amount on ₹10,000 after 2 years "
            "at 10% compound interest per annum?"
        ),
        "options": [
            "₹11,000",
            "₹11,200",
            "₹12,000",
            "₹12,100",
        ],
        "correct_option": 3,
        "explanation": (
            "Amount = 10000 × 1.1 × 1.1 = 12100."
        ),
    },
    {
        "category": "quantitative",
        "topic": "Probability",
        "difficulty": "hard",
        "question_text": (
            "Two fair coins are tossed. What is the probability "
            "of getting exactly one head?"
        ),
        "options": [
            "1/4",
            "1/3",
            "1/2",
            "3/4",
        ],
        "correct_option": 2,
        "explanation": (
            "Possible outcomes are HH, HT, TH and TT. "
            "Two of four outcomes contain exactly one head."
        ),
    },

    {
        "category": "logical",
        "topic": "Number Series",
        "difficulty": "easy",
        "question_text": (
            "Find the next number: 2, 6, 12, 20, 30, ?"
        ),
        "options": [
            "36",
            "40",
            "42",
            "44",
        ],
        "correct_option": 2,
        "explanation": (
            "The differences are 4, 6, 8, 10, so the next "
            "difference is 12. 30 + 12 = 42."
        ),
    },
    {
        "category": "logical",
        "topic": "Classification",
        "difficulty": "easy",
        "question_text": (
            "Which is the odd one out?"
        ),
        "options": [
            "Square",
            "Circle",
            "Triangle",
            "Cube",
        ],
        "correct_option": 3,
        "explanation": (
            "Square, circle and triangle are 2D shapes. "
            "A cube is a 3D solid."
        ),
    },
    {
        "category": "logical",
        "topic": "Coding-Decoding",
        "difficulty": "easy",
        "question_text": (
            "If CAT is coded as DBU by shifting every letter "
            "one position forward, how is DOG coded?"
        ),
        "options": [
            "EPH",
            "EOH",
            "FPH",
            "DNG",
        ],
        "correct_option": 0,
        "explanation": (
            "D→E, O→P and G→H, so DOG becomes EPH."
        ),
    },
    {
        "category": "logical",
        "topic": "Directions",
        "difficulty": "medium",
        "question_text": (
            "A person walks 5 km north, 3 km east, then "
            "5 km south. Where are they relative to the start?"
        ),
        "options": [
            "3 km east",
            "3 km west",
            "5 km north",
            "5 km south",
        ],
        "correct_option": 0,
        "explanation": (
            "The north and south movements cancel. "
            "The person remains 3 km east of the starting point."
        ),
    },
    {
        "category": "logical",
        "topic": "Number Series",
        "difficulty": "medium",
        "question_text": (
            "Find the next number: 81, 27, 9, 3, ?"
        ),
        "options": [
            "0",
            "1",
            "2",
            "6",
        ],
        "correct_option": 1,
        "explanation": (
            "Each number is divided by 3. "
            "3 ÷ 3 = 1."
        ),
    },
    {
        "category": "logical",
        "topic": "Letter Series",
        "difficulty": "medium",
        "question_text": (
            "Find the next letter: A, C, F, J, O, ?"
        ),
        "options": [
            "T",
            "U",
            "V",
            "W",
        ],
        "correct_option": 1,
        "explanation": (
            "Positions increase by +2, +3, +4, +5, then +6. "
            "O + 6 = U."
        ),
    },
    {
        "category": "logical",
        "topic": "Syllogism",
        "difficulty": "medium",
        "question_text": (
            "All analysts are graduates. Ravi is an analyst. "
            "Which conclusion must be true?"
        ),
        "options": [
            "Ravi is a graduate",
            "All graduates are analysts",
            "Ravi is not a graduate",
            "No analyst is a graduate",
        ],
        "correct_option": 0,
        "explanation": (
            "If every analyst is a graduate and Ravi is an analyst, "
            "Ravi must be a graduate."
        ),
    },
    {
        "category": "logical",
        "topic": "Blood Relations",
        "difficulty": "hard",
        "question_text": (
            "Maya is the sister of Arun. Arun is the father of Neha. "
            "How is Maya related to Neha?"
        ),
        "options": [
            "Mother",
            "Sister",
            "Aunt",
            "Cousin",
        ],
        "correct_option": 2,
        "explanation": (
            "Maya is the sister of Neha's father, making Maya Neha's aunt."
        ),
    },
    {
        "category": "logical",
        "topic": "Ordering",
        "difficulty": "hard",
        "question_text": (
            "P is taller than Q. Q is taller than R. "
            "S is taller than P. Who is tallest?"
        ),
        "options": [
            "P",
            "Q",
            "R",
            "S",
        ],
        "correct_option": 3,
        "explanation": (
            "The order is S > P > Q > R."
        ),
    },
    {
        "category": "logical",
        "topic": "Analogy",
        "difficulty": "hard",
        "question_text": (
            "Bird is to Nest as Bee is to:"
        ),
        "options": [
            "Cave",
            "Hive",
            "Web",
            "Den",
        ],
        "correct_option": 1,
        "explanation": (
            "A nest is the typical home of a bird; "
            "a hive is the typical home of bees."
        ),
    },

    {
        "category": "verbal",
        "topic": "Synonyms",
        "difficulty": "easy",
        "question_text": (
            "Choose the word closest in meaning to 'concise'."
        ),
        "options": [
            "Lengthy",
            "Brief",
            "Confusing",
            "Indirect",
        ],
        "correct_option": 1,
        "explanation": (
            "Concise means brief and clearly expressed."
        ),
    },
    {
        "category": "verbal",
        "topic": "Antonyms",
        "difficulty": "easy",
        "question_text": (
            "Choose the antonym of 'scarce'."
        ),
        "options": [
            "Rare",
            "Limited",
            "Abundant",
            "Small",
        ],
        "correct_option": 2,
        "explanation": (
            "Scarce means insufficient or rare; abundant means plentiful."
        ),
    },
    {
        "category": "verbal",
        "topic": "Grammar",
        "difficulty": "easy",
        "question_text": (
            "Choose the grammatically correct sentence."
        ),
        "options": [
            "Each of the students have submitted the assignment.",
            "Each of the students has submitted the assignment.",
            "Each of the student have submitted the assignment.",
            "Each students has submitted the assignment.",
        ],
        "correct_option": 1,
        "explanation": (
            "'Each' is singular, so the correct verb is 'has'."
        ),
    },
    {
        "category": "verbal",
        "topic": "Vocabulary",
        "difficulty": "medium",
        "question_text": (
            "What does the word 'pragmatic' most nearly mean?"
        ),
        "options": [
            "Idealistic",
            "Practical",
            "Emotional",
            "Careless",
        ],
        "correct_option": 1,
        "explanation": (
            "Pragmatic means dealing with problems in a practical "
            "rather than purely theoretical way."
        ),
    },
    {
        "category": "verbal",
        "topic": "Subject-Verb Agreement",
        "difficulty": "medium",
        "question_text": (
            "Choose the correct completion: "
            "'Neither the manager nor the employees ___ aware of the change.'"
        ),
        "options": [
            "was",
            "were",
            "is",
            "has",
        ],
        "correct_option": 1,
        "explanation": (
            "With 'neither...nor', the verb normally agrees with "
            "the nearer subject, 'employees', which is plural."
        ),
    },
    {
        "category": "verbal",
        "topic": "Analogy",
        "difficulty": "medium",
        "question_text": (
            "Doctor is to Hospital as Teacher is to:"
        ),
        "options": [
            "Library",
            "School",
            "Court",
            "Laboratory",
        ],
        "correct_option": 1,
        "explanation": (
            "A doctor typically works in a hospital; "
            "a teacher typically works in a school."
        ),
    },
    {
        "category": "verbal",
        "topic": "Grammar",
        "difficulty": "medium",
        "question_text": (
            "Which sentence is grammatically correct?"
        ),
        "options": [
            "He do not know the answer.",
            "He does not knows the answer.",
            "He does not know the answer.",
            "He not does know the answer.",
        ],
        "correct_option": 2,
        "explanation": (
            "After 'does not', the main verb remains in its base form: know."
        ),
    },
    {
        "category": "verbal",
        "topic": "Sentence Completion",
        "difficulty": "hard",
        "question_text": (
            "Choose the best word: '___ the heavy rain, the match continued.'"
        ),
        "options": [
            "Because",
            "Despite",
            "Unless",
            "Therefore",
        ],
        "correct_option": 1,
        "explanation": (
            "'Despite' expresses contrast between the rain "
            "and the fact that the match continued."
        ),
    },
    {
        "category": "verbal",
        "topic": "Reading Comprehension",
        "difficulty": "hard",
        "question_text": (
            "Read: 'Remote work can increase flexibility, but it also "
            "requires discipline and clear communication.' "
            "According to the statement, successful remote work requires:"
        ),
        "options": [
            "Less communication",
            "Only technical skill",
            "Discipline and clear communication",
            "Longer working hours",
        ],
        "correct_option": 2,
        "explanation": (
            "The passage explicitly identifies discipline and "
            "clear communication as requirements."
        ),
    },
    {
        "category": "verbal",
        "topic": "Vocabulary",
        "difficulty": "hard",
        "question_text": (
            "Choose the closest meaning of 'meticulous'."
        ),
        "options": [
            "Careless",
            "Very careful and precise",
            "Quick and impulsive",
            "Uncertain",
        ],
        "correct_option": 1,
        "explanation": (
            "Meticulous describes someone who pays very careful "
            "attention to detail."
        ),
    },
]


async def seed() -> None:
    async with (
        AsyncSessionLocal()
        as session
    ):
        existing_result = (
            await session.execute(
                select(
                    AptitudeQuestion
                    .question_text,
                )
            )
        )


        existing = set(
            existing_result
            .scalars()
            .all()
        )


        new_questions = [
            AptitudeQuestion(
                **question,
            )
            for question
            in QUESTIONS
            if (
                question[
                    "question_text"
                ]
                not in existing
            )
        ]


        if (
            not new_questions
        ):
            print(
                "Aptitude questions are already seeded."
            )

            return


        session.add_all(
            new_questions,
        )

        await session.commit()


        print(
            f"Added {len(new_questions)} aptitude questions."
        )


if __name__ == "__main__":
    asyncio.run(
        seed(),
    )