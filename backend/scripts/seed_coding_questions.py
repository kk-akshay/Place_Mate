import asyncio

from sqlalchemy import select

from app.db.session import (
    AsyncSessionLocal,
)
from app.models.coding import (
    CodingQuestion,
    CodingTestCase,
)

QUESTION_BANK = [
    {
        "slug": "sum-of-two-numbers",
        "title": "Sum of Two Numbers",
        "difficulty": "easy",
        "topic": "maths",
        "problem_statement": (
            "Read two integers and print their sum."
        ),
        "input_format": (
            "A single line containing two "
            "space-separated integers a and b."
        ),
        "output_format": (
            "Print one integer: a + b."
        ),
        "constraints": (
            "-1,000,000 <= a, b <= 1,000,000"
        ),
        "starter_code": (
            "def solve():\n"
            "    a, b = map(int, input().split())\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": "2 3\n",
                "expected_output": "5\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": "-7 10\n",
                "expected_output": "3\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": "0 0\n",
                "expected_output": "0\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": "999999 1\n",
                "expected_output": "1000000\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": "-20 -30\n",
                "expected_output": "-50\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "reverse-a-string",
        "title": "Reverse a String",
        "difficulty": "easy",
        "topic": "strings",
        "problem_statement": (
            "Read a string and print the characters "
            "in reverse order."
        ),
        "input_format": (
            "A single line containing the string."
        ),
        "output_format": (
            "Print the reversed string."
        ),
        "constraints": (
            "1 <= length of string <= 1000"
        ),
        "starter_code": (
            "def solve():\n"
            "    text = input()\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": "hello\n",
                "expected_output": "olleh\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": "placement\n",
                "expected_output": "tnemecalp\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": "a\n",
                "expected_output": "a\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": "racecar\n",
                "expected_output": "racecar\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": "12345\n",
                "expected_output": "54321\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "count-vowels",
        "title": "Count Vowels",
        "difficulty": "easy",
        "topic": "strings",
        "problem_statement": (
            "Count how many vowels occur in the "
            "given string. Treat uppercase and "
            "lowercase vowels equally."
        ),
        "input_format": (
            "A single line containing a string."
        ),
        "output_format": (
            "Print the number of vowels."
        ),
        "constraints": (
            "1 <= length of string <= 10,000"
        ),
        "starter_code": (
            "def solve():\n"
            "    text = input()\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": "hello\n",
                "expected_output": "2\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": "Education\n",
                "expected_output": "5\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": "rhythm\n",
                "expected_output": "0\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": "AEIOU\n",
                "expected_output": "5\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": "placement\n",
                "expected_output": "3\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "find-maximum",
        "title": "Find Maximum",
        "difficulty": "easy",
        "topic": "arrays",
        "problem_statement": (
            "Given a list of integers, print the "
            "largest value."
        ),
        "input_format": (
            "The first line contains n. "
            "The second line contains n "
            "space-separated integers."
        ),
        "output_format": (
            "Print the maximum integer."
        ),
        "constraints": (
            "1 <= n <= 100,000\n"
            "-1,000,000 <= value <= 1,000,000"
        ),
        "starter_code": (
            "def solve():\n"
            "    n = int(input())\n"
            "    numbers = list(map(int, input().split()))\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": (
                    "5\n"
                    "3 9 1 4 2\n"
                ),
                "expected_output": "9\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": (
                    "4\n"
                    "-5 -2 -8 -1\n"
                ),
                "expected_output": "-1\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": (
                    "1\n"
                    "42\n"
                ),
                "expected_output": "42\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": (
                    "6\n"
                    "7 7 7 7 7 7\n"
                ),
                "expected_output": "7\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": (
                    "5\n"
                    "-10 0 10 25 4\n"
                ),
                "expected_output": "25\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "palindrome-check",
        "title": "Palindrome Check",
        "difficulty": "easy",
        "topic": "strings",
        "problem_statement": (
            "Determine whether the given string "
            "reads the same forwards and backwards."
        ),
        "input_format": (
            "A single line containing the string."
        ),
        "output_format": (
            "Print YES if the string is a palindrome. "
            "Otherwise print NO."
        ),
        "constraints": (
            "1 <= length of string <= 100,000\n"
            "Comparison is case-sensitive."
        ),
        "starter_code": (
            "def solve():\n"
            "    text = input()\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": "madam\n",
                "expected_output": "YES\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": "hello\n",
                "expected_output": "NO\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": "a\n",
                "expected_output": "YES\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": "1221\n",
                "expected_output": "YES\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": "Level\n",
                "expected_output": "NO\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "medium",
        "topic": "hashing",
        "problem_statement": (
            "Find the two indices whose values add "
            "up to the target. Every test case has "
            "exactly one valid pair."
        ),
        "input_format": (
            "The first line contains n.\n"
            "The second line contains n integers.\n"
            "The third line contains the target."
        ),
        "output_format": (
            "Print the two zero-based indices "
            "separated by one space, with the "
            "smaller index first."
        ),
        "constraints": (
            "2 <= n <= 100,000\n"
            "-1,000,000 <= value, target <= 1,000,000"
        ),
        "starter_code": (
            "def solve():\n"
            "    n = int(input())\n"
            "    numbers = list(map(int, input().split()))\n"
            "    target = int(input())\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": (
                    "4\n"
                    "2 7 11 15\n"
                    "9\n"
                ),
                "expected_output": "0 1\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": (
                    "3\n"
                    "3 2 4\n"
                    "6\n"
                ),
                "expected_output": "1 2\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": (
                    "2\n"
                    "3 3\n"
                    "6\n"
                ),
                "expected_output": "0 1\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": (
                    "4\n"
                    "1 5 3 10\n"
                    "11\n"
                ),
                "expected_output": "0 3\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": (
                    "5\n"
                    "-3 4 8 2 9\n"
                    "6\n"
                ),
                "expected_output": "1 3\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "valid-anagram",
        "title": "Valid Anagram",
        "difficulty": "medium",
        "topic": "hashing",
        "problem_statement": (
            "Determine whether two strings contain "
            "exactly the same characters with the "
            "same frequencies."
        ),
        "input_format": (
            "The first line contains the first string.\n"
            "The second line contains the second string."
        ),
        "output_format": (
            "Print YES if the strings are anagrams. "
            "Otherwise print NO."
        ),
        "constraints": (
            "1 <= length of each string <= 100,000\n"
            "Comparison is case-sensitive."
        ),
        "starter_code": (
            "def solve():\n"
            "    first = input()\n"
            "    second = input()\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": (
                    "listen\n"
                    "silent\n"
                ),
                "expected_output": "YES\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": (
                    "hello\n"
                    "world\n"
                ),
                "expected_output": "NO\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": (
                    "triangle\n"
                    "integral\n"
                ),
                "expected_output": "YES\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": (
                    "aacc\n"
                    "ccaa\n"
                ),
                "expected_output": "YES\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": (
                    "abc\n"
                    "abcc\n"
                ),
                "expected_output": "NO\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "first-non-repeating-character",
        "title": "First Non-Repeating Character",
        "difficulty": "medium",
        "topic": "hashing",
        "problem_statement": (
            "Find the first character that occurs "
            "exactly once in the string."
        ),
        "input_format": (
            "A single line containing the string."
        ),
        "output_format": (
            "Print the first non-repeating character. "
            "Print -1 if every character repeats."
        ),
        "constraints": (
            "1 <= length of string <= 100,000"
        ),
        "starter_code": (
            "def solve():\n"
            "    text = input()\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": "swiss\n",
                "expected_output": "w\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": "aabbcdd\n",
                "expected_output": "c\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": "aabb\n",
                "expected_output": "-1\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": "placement\n",
                "expected_output": "p\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": "x\n",
                "expected_output": "x\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "remove-duplicates",
        "title": "Remove Duplicates",
        "difficulty": "medium",
        "topic": "arrays",
        "problem_statement": (
            "Remove duplicate integers while "
            "preserving the order of their first "
            "appearance."
        ),
        "input_format": (
            "The first line contains n.\n"
            "The second line contains n "
            "space-separated integers."
        ),
        "output_format": (
            "Print the remaining integers separated "
            "by one space."
        ),
        "constraints": (
            "1 <= n <= 100,000\n"
            "-1,000,000 <= value <= 1,000,000"
        ),
        "starter_code": (
            "def solve():\n"
            "    n = int(input())\n"
            "    numbers = list(map(int, input().split()))\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": (
                    "7\n"
                    "1 2 2 3 1 4 4\n"
                ),
                "expected_output": "1 2 3 4\n",
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": (
                    "5\n"
                    "5 5 5 5 5\n"
                ),
                "expected_output": "5\n",
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": (
                    "1\n"
                    "9\n"
                ),
                "expected_output": "9\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": (
                    "6\n"
                    "-1 0 -1 2 0 3\n"
                ),
                "expected_output": "-1 0 2 3\n",
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": (
                    "8\n"
                    "4 3 4 2 3 1 2 1\n"
                ),
                "expected_output": "4 3 2 1\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
    {
        "slug": "frequency-counter",
        "title": "Frequency Counter",
        "difficulty": "medium",
        "topic": "hashing",
        "problem_statement": (
            "Count the frequency of every integer. "
            "Print the values in ascending numerical "
            "order."
        ),
        "input_format": (
            "The first line contains n.\n"
            "The second line contains n "
            "space-separated integers."
        ),
        "output_format": (
            "Print entries in the form value:count, "
            "separated by one space, ordered by value."
        ),
        "constraints": (
            "1 <= n <= 100,000\n"
            "-1,000,000 <= value <= 1,000,000"
        ),
        "starter_code": (
            "def solve():\n"
            "    n = int(input())\n"
            "    numbers = list(map(int, input().split()))\n"
            "\n"
            "    # Write your code here\n"
            "\n"
            "\n"
            "if __name__ == \"__main__\":\n"
            "    solve()\n"
        ),
        "test_cases": [
            {
                "input_data": (
                    "5\n"
                    "1 2 2 3 1\n"
                ),
                "expected_output": (
                    "1:2 2:2 3:1\n"
                ),
                "is_hidden": False,
                "position": 1,
            },
            {
                "input_data": (
                    "4\n"
                    "-1 -1 0 2\n"
                ),
                "expected_output": (
                    "-1:2 0:1 2:1\n"
                ),
                "is_hidden": False,
                "position": 2,
            },
            {
                "input_data": (
                    "1\n"
                    "10\n"
                ),
                "expected_output": "10:1\n",
                "is_hidden": True,
                "position": 3,
            },
            {
                "input_data": (
                    "6\n"
                    "10 5 10 5 10 2\n"
                ),
                "expected_output": (
                    "2:1 5:2 10:3\n"
                ),
                "is_hidden": True,
                "position": 4,
            },
            {
                "input_data": (
                    "5\n"
                    "0 0 0 0 0\n"
                ),
                "expected_output": "0:5\n",
                "is_hidden": True,
                "position": 5,
            },
        ],
    },
]


async def seed_coding_questions() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(
                CodingQuestion.slug,
            )
        )

        existing_slugs = set(
            result.scalars().all()
        )

        created_count = 0
        skipped_count = 0

        for item in QUESTION_BANK:
            slug = str(
                item["slug"]
            )

            if slug in existing_slugs:
                skipped_count += 1
                continue

            raw_test_cases = (
                item["test_cases"]
            )

            if not isinstance(
                raw_test_cases,
                list,
            ):
                raise TypeError(
                    "Coding question test_cases "
                    "must be a list."
                )

            test_cases = [
                CodingTestCase(
                    input_data=
                        str(
                            test_case[
                                "input_data"
                            ]
                        ),
                    expected_output=
                        str(
                            test_case[
                                "expected_output"
                            ]
                        ),
                    is_hidden=
                        bool(
                            test_case[
                                "is_hidden"
                            ]
                        ),
                    position=
                        int(
                            test_case[
                                "position"
                            ]
                        ),
                )
                for test_case
                in raw_test_cases
            ]

            question = CodingQuestion(
                slug=slug,
                title=str(
                    item["title"]
                ),
                difficulty=str(
                    item[
                        "difficulty"
                    ]
                ),
                topic=str(
                    item["topic"]
                ),
                problem_statement=str(
                    item[
                        "problem_statement"
                    ]
                ),
                input_format=str(
                    item[
                        "input_format"
                    ]
                ),
                output_format=str(
                    item[
                        "output_format"
                    ]
                ),
                constraints=str(
                    item[
                        "constraints"
                    ]
                ),
                starter_code=str(
                    item[
                        "starter_code"
                    ]
                ),
                is_active=True,
                test_cases=
                    test_cases,
            )

            session.add(
                question
            )

            existing_slugs.add(
                slug
            )

            created_count += 1

        await session.commit()

        print(
            "Coding question seed complete."
        )

        print(
            f"Created: {created_count}"
        )

        print(
            f"Skipped existing: {skipped_count}"
        )


if __name__ == "__main__":
    asyncio.run(
        seed_coding_questions()
    )