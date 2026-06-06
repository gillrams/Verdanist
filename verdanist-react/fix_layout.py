import re

with open('src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove Left Column wrapper start and add classes to Hero
code = code.replace(
'''        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col gap-4 lg:gap-6">
          
          {/* Hero sensor card */}
          <div className="w-full">''',
'''        {/* Hero sensor card */}
        <div className="lg:col-span-7 order-1 w-full">'''
)

# 2. Add classes to Right Column wrapper
code = code.replace(
'''        {/* Right Column */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-6">''',
'''        {/* Right Column */}
        <div className="lg:col-span-5 lg:row-span-2 order-2 flex flex-col gap-4 lg:gap-6">'''
)

# 3. For the Charts, we need to extract it out of the Left Column.
# Currently Charts is inside Left Column, which means Left Column is closed BEFORE Right Column.
# So we need to remove the closing div of Left Column, and add classes to Charts.
code = code.replace(
'''          {/* Charts separated */}
          <div className="grid grid-cols-1 gap-3 lg:gap-4">''',
'''          {/* Charts separated */}
          <div className="lg:col-span-7 order-3 grid grid-cols-1 gap-3 lg:gap-4">'''
)

# 4. Remove the closing div of Left Column, which is right before Right Column
code = code.replace(
'''            </div>
          </div>
        </div>

        {/* Right Column */}''',
'''            </div>
          </div>

        {/* Right Column */}'''
)

with open('src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
