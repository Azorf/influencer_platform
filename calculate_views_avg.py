def convert_value(value_str):
    """Convert a string like '351k' or '1.2M' to a number."""
    value_str = value_str.strip().lower()  # convert to lowercase
    if value_str.endswith('k'):
        return float(value_str[:-1]) * 1_000
    elif value_str.endswith('m'):
        return float(value_str[:-1]) * 1_000_000
    else:
        return float(value_str.replace(',', ''))  # remove commas if any

def calculate_average(file_path):
    values = []
    with open(file_path, 'r') as f:
        for line in f:
            if line.strip():  # skip empty lines
                try:
                    values.append(convert_value(line))
                except ValueError:
                    print(f"Skipping invalid line: {line.strip()}")
    if not values:
        return 0
    return sum(values) / len(values)

if __name__ == "__main__":
    file_path = "views_data.txt"  # replace with your file path
    avg = int(calculate_average(file_path))
    print(f"Average: {avg}")
