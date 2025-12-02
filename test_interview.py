# numbers List[int] - targets int
# [1,3,5,7] - target = 4 -- [1,3]
# [1,3,5,7] - taregt = 10 -- NULL
#[1,4,9,16]
def pre_sums(numbers):
    a = numbers[0]
    summed_array={1: a}
    for i in range(1, len(numbers)-1):
        a = a + numbers[i+1]
        summed_array[i+1] = a
    return summed_array


def find_sub_array(numbers, target):
    pre_sum = pre_sums(numbers)
    for k, v in pre_sum.items():
        if target in pre_sum.values():
            return (k, v)


        

# pre_sums([1,3,5,7])

print(find_sub_array([1,3,5,7], 1))